// TutorConnect Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
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
