import { eventHandler } from '../../../public/js/index.js';

describe('index', () => {
  test('should convert dates from UTC to local time after content is loaded', async () => {
    const dateInMs = Date.now();
    const dateInMsString = dateInMs.toString();
    const localDateString = new Date(dateInMs).toLocaleString();

    document.body.innerHTML = `<div data-date-in-ms="${dateInMsString}">${dateInMsString}</div>`;

    await import('../../../public/js/index.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.querySelector('div').textContent).toEqual(localDateString);
  });

  describe('eventHandler', () => {
    test('should have a convertDatesFromUtcToLocal function', () => {
      expect(eventHandler.convertDatesFromUtcToLocal).toBeDefined();
    });

    describe('convertDatesFromUtcToLocal', () => {
      test('should convert dates from UTC to local time', () => {
        const dateInMs = Date.now();
        const dateInMsString = dateInMs.toString();
        const localDateString = new Date(dateInMs).toLocaleString();

        document.body.innerHTML = `<div data-date-in-ms="${dateInMsString}">${dateInMsString}</div>`;

        eventHandler.convertDatesFromUtcToLocal();

        expect(document.querySelector('div').textContent).toEqual(
          localDateString
        );
      });
    });
  });
});
