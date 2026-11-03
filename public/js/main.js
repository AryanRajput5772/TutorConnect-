// TutorConnect Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // 0. Multi-Theme Switcher (Light / Midnight Blue / All-Black OLED)
  const themeToggle = document.getElementById('themeToggle');
  const themeSwitcherWrapper = document.getElementById('themeSwitcherWrapper');
  const themeDropdownMenu = document.getElementById('themeDropdownMenu');
  const themeOptions = document.querySelectorAll('.theme-option-item');

  const updateActiveOptionUI = (currentTheme) => {
    themeOptions.forEach(opt => {
      if (opt.getAttribute('data-theme-val') === currentTheme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  };

  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    try {
      localStorage.setItem('tutorconnect_theme', themeName);
    } catch (err) {}
    updateActiveOptionUI(themeName);
  };

  // Initial state check
  const activeInitialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateActiveOptionUI(activeInitialTheme);

  if (themeToggle && themeDropdownMenu) {
    let hideTimer = null;

    const openDropdown = () => {
      clearTimeout(hideTimer);
      themeDropdownMenu.classList.add('show');
    };

    const closeDropdown = (delay = 250) => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        themeDropdownMenu.classList.remove('show');
      }, delay);
    };

    // Hover support with generous grace period so moving cursor to menu never vanishes
    if (themeSwitcherWrapper) {
      themeSwitcherWrapper.addEventListener('mouseenter', openDropdown);
      themeSwitcherWrapper.addEventListener('mouseleave', () => closeDropdown(250));
    }
    themeDropdownMenu.addEventListener('mouseenter', openDropdown);
    themeDropdownMenu.addEventListener('mouseleave', () => closeDropdown(200));

    // Clicking toggle button toggles menu open/closed
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(hideTimer);
      themeDropdownMenu.classList.toggle('show');
    });

    // Right-click or context menu
    themeToggle.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      clearTimeout(hideTimer);
      themeDropdownMenu.classList.toggle('show');
    });

    // Clicking an option in dropdown
    themeOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(hideTimer);
        const selected = opt.getAttribute('data-theme-val');
        if (selected) {
          applyTheme(selected);
          themeDropdownMenu.classList.remove('show');
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (themeSwitcherWrapper && !themeSwitcherWrapper.contains(e.target)) {
        clearTimeout(hideTimer);
        themeDropdownMenu.classList.remove('show');
      }
    });
  }

  // 1. Mobile Menu Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navToggle.classList.toggle('active');
      navMenu.classList.toggle('show');
      navToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('show') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close mobile menu when a nav link is clicked
    navMenu.querySelectorAll('.nav-link, .btn').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. Admin Zoom Meeting Modal Handler
  const zoomModal = document.getElementById('zoomModal');
  const zoomForm = document.getElementById('zoomForm');
  const closeZoomModal = document.getElementById('closeZoomModal');
  const cancelZoomModal = document.getElementById('cancelZoomModal');
  const modalTutorTitle = document.getElementById('modalTutorTitle');
  const modalTutorName = document.getElementById('modalTutorName');
  const modalTutorEmail = document.getElementById('modalTutorEmail');
  const modalZoomLinkInput = document.getElementById('modalZoomLinkInput');
  const modalScheduledAt = document.getElementById('modalScheduledAt');

  // Helper to open modal
  const openZoomModal = (button) => {
    const tutorId = button.getAttribute('data-tutor-id');
    const tutorName = button.getAttribute('data-tutor-name');
    const tutorEmail = button.getAttribute('data-tutor-email');
    const currentZoom = button.getAttribute('data-current-zoom') || '';

    if (zoomForm) {
      zoomForm.action = `/admin/tutors/${tutorId}/send-zoom`;
    }

    if (modalTutorTitle) {
      modalTutorTitle.innerText = `Schedule Zoom Interview: ${tutorName}`;
    }
    if (modalTutorName) {
      modalTutorName.innerText = tutorName;
    }
    if (modalTutorEmail) {
      modalTutorEmail.innerText = tutorEmail;
    }
    if (modalZoomLinkInput) {
      modalZoomLinkInput.value = currentZoom || `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}?pwd=tc${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Set default scheduled time to tomorrow at 11:00 AM if not set
    if (modalScheduledAt && !modalScheduledAt.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      const isoLocal = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      modalScheduledAt.value = isoLocal;
    }

    if (zoomModal) {
      zoomModal.style.display = 'flex';
    }
  };

  // Attach event listeners to all "Send Zoom Link" buttons
  const zoomButtons = document.querySelectorAll('.open-zoom-modal-btn');
  zoomButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openZoomModal(btn);
    });
  });

  // Modal Close Actions
  const hideModal = () => {
    if (zoomModal) {
      zoomModal.style.display = 'none';
    }
  };

  if (closeZoomModal) closeZoomModal.addEventListener('click', hideModal);
  if (cancelZoomModal) cancelZoomModal.addEventListener('click', hideModal);

  // Close when clicking backdrop
  if (zoomModal) {
    zoomModal.addEventListener('click', (e) => {
      if (e.target === zoomModal) {
        hideModal();
      }
    });
  }

  // 3. Auto dismiss flash alerts after 6 seconds
  const alerts = document.querySelectorAll('.alert');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach((alert) => {
        alert.style.transition = 'opacity 0.5s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
      });
    }, 6000);
  }

  // 4. Toggle password visibility
  const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = targetId ? document.getElementById(targetId) : btn.closest('.password-input-wrapper')?.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeShow = btn.querySelector('.eye-show');
      const eyeHide = btn.querySelector('.eye-hide');

      if (eyeShow && eyeHide) {
        if (isPassword) {
          eyeShow.style.display = 'none';
          eyeHide.style.display = 'block';
          btn.setAttribute('aria-label', 'Hide password');
          btn.setAttribute('title', 'Hide password');
        } else {
          eyeShow.style.display = 'block';
          eyeHide.style.display = 'none';
          btn.setAttribute('aria-label', 'Show password');
          btn.setAttribute('title', 'Show password');
        }
      }
    });
  });
});
