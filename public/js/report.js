document.addEventListener('DOMContentLoaded', () => {
  const paths = window.location.pathname.split('/');
  const reportName = paths[paths.length - 1];

  const heading = document.createElement('h1');
  heading.textContent = `Playwright Report ${reportName}`;
  document.body.prepend(heading);
});
