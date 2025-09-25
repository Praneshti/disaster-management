
document.addEventListener('DOMContentLoaded', function() {
  const donateForm = document.getElementById('donateForm');
  const donationTrackId = document.getElementById('donationTrackId');
  const donationTrackBtn = document.getElementById('donationTrackBtn');
  const donationTrackError = document.getElementById('donationTrackError');
  const donationTracker = document.getElementById('donationTracker');
  const pastDonationsEl = document.getElementById('pastDonations');
  

  if (donateForm) {
    donateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const statusDiv = document.getElementById('status');
     
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span style="margin-right: 0.5rem;">⏳</span>Submitting...';
      }
      
      try {
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());

      
        if (payload.anonymous === 'on') payload.anonymous = true;

        const response = await fetch('/api/donations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (statusDiv) {
            statusDiv.innerHTML = `
              <div class="alert alert-success">
                <div class="flex items-center">
                  <span style="font-size: 1.5rem; margin-right: 0.75rem;">✅</span>
                  <div>
                    <h3 class="font-semibold">Donation Recorded Successfully!</h3>
                    <p style="font-size: 0.875rem; margin-top: 0.25rem;">Donation ID: <strong>${data._id || data.id || 'N/A'}</strong></p>
                    <p style="font-size: 0.875rem; margin-top: 0.25rem;">Thank you for your generosity! Our team will contact you soon.</p>
                  </div>
                </div>
              </div>
            `;
          }
          
          const createdId = data._id || data.id;
          if (createdId) {
            if (donationTrackId) donationTrackId.value = createdId;
            localStorage.setItem('lastDonationId', createdId);
            const existing = JSON.parse(localStorage.getItem('myDonationIds') || '[]');
            if (!existing.includes(createdId)) {
              existing.unshift(createdId);
              localStorage.setItem('myDonationIds', JSON.stringify(existing.slice(0, 20)));
            }
            await updateDonationTracker(createdId);
          }
          
         
          e.target.reset();
        } else {
          const messages = Array.isArray(data.errors)
            ? data.errors.map(err => err.msg || err.message).join('\n')
            : (data.message || 'Failed to record donation');
          throw new Error(messages);
        }
      } catch (error) {
        if (statusDiv) {
          statusDiv.innerHTML = `
            <div class="alert alert-error">
              <div class="flex items-center">
                <span style="font-size: 1.5rem; margin-right: 0.75rem;">❌</span>
                <div>
                  <h3 class="font-semibold">Submission Failed</h3>
                  <p style="font-size: 0.875rem; margin-top: 0.25rem;">${error.message}</p>
                  <p style="font-size: 0.875rem; margin-top: 0.25rem;">Please try again or contact our support team.</p>
                </div>
              </div>
            </div>
          `;
        }
      } finally {
       
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = '<span style="margin-right: 0.5rem;">💝</span>Submit Donation';
        }
      }
    });
  }
  
  if (pastDonationsEl) {
    loadPastDonations();
  }

  async function loadPastDonations() {
    try {
      const res = await fetch('/api/donations');
      let items = [];
      if (res.ok) {
        const resp = await res.json();
        items = Array.isArray(resp) ? resp : (resp && resp.data) || [];
      }
      if (!Array.isArray(items) || items.length === 0) {
        const ids = JSON.parse(localStorage.getItem('myDonationIds') || '[]');
        if (ids.length > 0) {
          const fetched = [];
          for (const id of ids) {
            try {
              const it = await fetchDonationById(id);
              if (it && it._id) fetched.push(it);
            } catch (_) {}
          }
          items = fetched;
        }
      }
      renderPastDonations(items);
    } catch (err) {
      const ids = JSON.parse(localStorage.getItem('myDonationIds') || '[]');
      if (ids.length > 0) {
        const fetched = [];
        for (const id of ids) {
          try {
            const it = await fetchDonationById(id);
            if (it && it._id) fetched.push(it);
          } catch (_) {}
        }
        renderPastDonations(fetched);
        return;
      }
      pastDonationsEl.innerHTML = `<div class=\"alert alert-error\">${err.message}</div>`;
    }
  }

  function renderPastDonations(items) {
    if (!Array.isArray(items) || items.length === 0) {
      pastDonationsEl.innerHTML = '<p class="text-center text-gray-600">No past donations found.</p>';
      return;
    }
    const html = items.map(item => {
      const id = item._id;
      const created = new Date(item.createdAt).toLocaleString();
      const status = item.status || 'pending_pickup';
      const type = item.itemType || item.item;
      const qty = item.quantity;
      return `
        <div class="bg-white rounded-2xl shadow p-4">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div>
              <h3 class="font-semibold text-gray-900" style="margin:0;">${type} (${qty})</h3>
              <p class="text-sm text-gray-600" style="margin:4px 0 0 0;">ID: <code>${id}</code></p>
            </div>
            <div style="text-align:right;">
              <div class="badge">Status: ${status}</div>
              <div style="font-size:12px;color:#666;">${created}</div>
            </div>
          </div>
          <div class="text-right" style="margin-top:8px;">
            <button type="button" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold" data-donation-track-id="${id}">Track</button>
          </div>
        </div>
      `;
    }).join('');
    pastDonationsEl.innerHTML = html;
    pastDonationsEl.querySelectorAll('[data-donation-track-id]').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.getAttribute('data-donation-track-id');
        if (donationTrackId) donationTrackId.value = id;
        localStorage.setItem('lastDonationId', id);
        await updateDonationTracker(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }
  
  const lastDonationId = localStorage.getItem('lastDonationId');
  if (lastDonationId && donationTrackId) {
    donationTrackId.value = lastDonationId;
    updateDonationTracker(lastDonationId);
  }

 
  if (donationTrackBtn && donationTrackId) {
    donationTrackBtn.addEventListener('click', async () => {
      if (donationTrackError) donationTrackError.textContent = '';
      const id = (donationTrackId.value || '').trim();
      if (!id) {
        if (donationTrackError) donationTrackError.textContent = 'Please enter a Donation ID.';
        return;
      }
      try {
        await updateDonationTracker(id);
        localStorage.setItem('lastDonationId', id);
      } catch (err) {
        if (donationTrackError) donationTrackError.textContent = err.message || 'Failed to fetch donation status.';
      }
    });
  }

  async function fetchDonationById(id) {
    const res = await fetch(`/api/donations/${encodeURIComponent(id)}`);
    if (!res.ok) {
      let message = 'Donation not found';
      try {
        const data = await res.json();
        message = data.message || message;
      } catch (_) {}
      throw new Error(message);
    }
    return res.json();
  }

  async function updateDonationTracker(id) {
    const data = await fetchDonationById(id);
    const status = data.status || 'pending_pickup';
    highlightDonationStep(status);
  }

  function highlightDonationStep(currentStatus) {
    if (!donationTracker) return;
    const steps = donationTracker.querySelectorAll('[data-step]');
    steps.forEach(step => {
      step.classList.remove('active');
      step.style.opacity = '0.5';
    });
    const currentEl = donationTracker.querySelector(`[data-step="${currentStatus}"]`);
    if (currentEl) {
      currentEl.classList.add('active');
      currentEl.style.opacity = '1';
    }
  }
});