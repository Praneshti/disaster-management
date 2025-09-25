
let allResources = [];
let filteredResources = [];


const statusConfig = {
  available: { icon: '✅', color: 'green', text: 'Available' },
  low: { icon: '⚠️', color: 'yellow', text: 'Low Stock' },
  out: { icon: '❌', color: 'red', text: 'Out of Stock' }
};

const typeIcons = {
  food: '🍞',
  medicine: '💊',
  shelter: '🏠',
  clothes: '👕',
  water: '💧',
  volunteers: '🤝',
  rescue: '🚁',
  other: '📦'
};

function getStatusFromQuantity(quantity) {
  if (quantity === 0) return 'out';
  if (quantity < 10) return 'low';
  return 'available';
}

function renderResources(resources) {
  const container = document.getElementById('resources');
  const noResults = document.getElementById('noResults');
  
  if (!container) return;
  
  if (resources.length === 0) {
    container.innerHTML = '';
    if (noResults) {
      noResults.classList.remove('hidden');
    }
    return;
  }
  
  if (noResults) {
    noResults.classList.add('hidden');
  }
  
  container.innerHTML = resources.map(resource => {
    const resourceType = resource.resourceType || resource.type || 'other';
    const status = getStatusFromQuantity(Number(resource.quantity || 0));
    const statusInfo = statusConfig[status];
    const typeIcon = typeIcons[resourceType] || '📦';
    
    return `
      <div class="resource-card card-3d">
        <div class="resource-card-header">
          <div class="resource-card-info">
            <div class="resource-card-icon">${typeIcon}</div>
            <div class="resource-card-details">
              <h3>${resourceType}</h3>
              <p class="resource-card-donor">${resource.provider || resource.donor || 'Anonymous'}</p>
            </div>
          </div>
          <span class="resource-card-status ${status}">
            ${statusInfo.icon} ${statusInfo.text}
          </span>
        </div>
        
        <div class="resource-card-content">
          <div class="resource-card-item">
            <span class="resource-card-item-icon">📊</span>
            <span>Quantity: <strong>${resource.quantity}</strong></span>
          </div>
          
          <div class="resource-card-item">
            <span class="resource-card-item-icon">📍</span>
            <span>${resource.location}</span>
          </div>
          
          ${(resource.description || resource.notes) ? `
            <div class="resource-card-item">
              <span class="resource-card-item-icon">📝</span>
              <span>${resource.description || resource.notes}</span>
            </div>
          ` : ''}
          
          ${(resource.contact) ? `
            <div class="resource-card-item">
              <span class="resource-card-item-icon">📞</span>
              <span>${resource.contact}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="resource-card-footer">
          <span class="resource-card-date">
            Updated: ${new Date(resource.updatedAt || resource.createdAt).toLocaleDateString()}
          </span>
          <button class="resource-card-link">
            View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterResources() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (!searchInput || !typeFilter || !statusFilter) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const typeValue = typeFilter.value;
  const statusValue = statusFilter.value;
  
  filteredResources = allResources.filter(resource => {
    const matchesSearch = !searchTerm || 
      resource.type.toLowerCase().includes(searchTerm) ||
      resource.description?.toLowerCase().includes(searchTerm) ||
      resource.location.toLowerCase().includes(searchTerm);
    
    const matchesType = !typeValue || resource.type === typeValue;
    
    const matchesStatus = !statusValue || getStatusFromQuantity(resource.quantity) === statusValue;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  renderResources(filteredResources);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load resources
  fetch('/api/resources')
    .then(response => response.json())
    .then(resp => {
      const data = Array.isArray(resp) ? resp : (resp && resp.data) || [];
      allResources = data;
      filteredResources = data;
      renderResources(data);
    })
    .catch(error => {
      console.error('Error loading resources:', error);
      const container = document.getElementById('resources');
      if (container) {
        container.innerHTML = `
          <div class="resources-error">
            <div class="resources-error-icon">❌</div>
            <h3 class="resources-error-title">Failed to load resources</h3>
            <p class="resources-error-text">Please try again later</p>
          </div>
        `;
      }
    });

  // Event listeners
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const mapToggle = document.getElementById('mapToggle');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterResources);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', filterResources);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterResources);
  }
  
  if (mapToggle) {
    mapToggle.addEventListener('click', function() {
      // Future enhancement: implement map view
      alert('Map view coming soon!');
    });
  }

  // Add resource form submission
  const addResourceForm = document.getElementById('addResourceForm');
  const addResStatus = document.getElementById('addResStatus');
  if (addResourceForm) {
    addResourceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addResourceForm);
      const payload = Object.fromEntries(formData.entries());
      if (addResStatus) addResStatus.innerHTML = '<div class="alert">Submitting...</div>';
      try {
        const res = await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = Array.isArray(data.errors) ? data.errors.map(e => e.msg).join('\n') : (data.message || 'Failed to add resource');
          throw new Error(msg);
        }
        if (addResStatus) addResStatus.innerHTML = '<div class="alert alert-success">Resource added!</div>';
        addResourceForm.reset();
        // Refresh list
        const listRes = await fetch('/api/resources');
        const list = await listRes.json();
        allResources = list;
        filteredResources = list;
        renderResources(list);
      } catch (err) {
        if (addResStatus) addResStatus.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }
});