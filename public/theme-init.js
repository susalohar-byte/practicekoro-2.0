      // Theme no-flash: apply saved/system theme before first paint
      (function () {
        try {
          var m = localStorage.getItem('pk_theme');
          var dark =
            m === 'dark' ||
            ((m === null || m === 'system') &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (dark) {
            document.documentElement.classList.add('dark');
            document.documentElement.dataset.theme = 'dark';
            document.documentElement.style.colorScheme = 'dark';
          }
        } catch (e) {}
      })();
