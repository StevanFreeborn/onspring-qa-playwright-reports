import { eventHandler } from '../../../public/js/nav.js';

describe('nav', () => {
  test('it should add event listeners when content is loaded an buttons are present', async () => {
    jest.spyOn(eventHandler, 'logOutUser').mockImplementation();
    jest.spyOn(eventHandler, 'toggleNav').mockImplementation();

    document.body.innerHTML = `
      <div class="right-header">
        <button id="logout"></button>
      </div>
      <button id="toggle"></button>
    `;

    await import('../../../public/js/nav.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    document.getElementById('logout').click();
    document.getElementById('toggle').click();

    expect(eventHandler.logOutUser).toHaveBeenCalledTimes(1);
    expect(eventHandler.toggleNav).toHaveBeenCalledTimes(1);
  });

  describe('eventHandler', () => {
    test('it should have a logOutUser function', () => {
      expect(eventHandler.logOutUser).toBeDefined();
    });

    test('it should have a toggleNav function', () => {
      expect(eventHandler.toggleNav).toBeDefined();
    });

    test('it should have a getCsrfToken function', () => {
      expect(eventHandler.getCsrfToken).toBeDefined();
    });

    describe('toggleNav', () => {
      test('it should toggle the navigation menu', () => {
        document.body.innerHTML = `
          <div class="right-header">
          </div>
        `;

        eventHandler.toggleNav();

        expect(
          document.querySelector('.right-header').classList.contains('show')
        ).toEqual(true);

        eventHandler.toggleNav();

        expect(
          document.querySelector('.right-header').classList.contains('show')
        ).toEqual(false);
      });
    });

    describe('logOutUser', () => {
      const orgFetch = global.fetch;

      beforeEach(() => {
        global.fetch = jest.fn();
      });

      afterEach(() => {
        global.fetch = orgFetch;
      });

      test('it should redirect user to response url when logout is successful', async () => {
        jest
          .spyOn(eventHandler, 'getCsrfToken')
          .mockReturnValue('test-csrf-token');

        jest.spyOn(global, 'fetch').mockReturnValue({
          redirected: true,
          url: 'test-url',
        });

        const windowLocation = window.location;
        delete window.location;
        window.location = {
          href: {
            _href: '',

            get value() {
              return this._href;
            },

            set value(href) {
              this._href = href;
            },
          },
        };

        await eventHandler.logOutUser();

        expect(window.location.href).toEqual('test-url');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            _csrf: 'test-csrf-token',
          }),
        });

        window.location = windowLocation;
      });

      test('it should alert user when logout is unsuccessful', async () => {
        jest
          .spyOn(eventHandler, 'getCsrfToken')
          .mockReturnValue('test-csrf-token');

        jest.spyOn(window, 'alert').mockImplementation();

        fetch.mockReturnValue({
          redirected: false,
          url: 'test-url',
        });

        await eventHandler.logOutUser();

        expect(window.alert).toHaveBeenCalledTimes(1);
        expect(window.alert).toHaveBeenCalledWith(
          'We were unable to log you out. Please try again.'
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            _csrf: 'test-csrf-token',
          }),
        });
      });
    });

    describe('getCsrfToken', () => {
      test('it should return csrf token from page', () => {
        document.head.innerHTML =
          '<meta name="csrf-token" content="test-csrf-token">';
        expect(eventHandler.getCsrfToken()).toEqual('test-csrf-token');
      });
    });
  });
});
