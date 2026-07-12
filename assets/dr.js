// MAGNE.AI DR Site — Simple utilities
(function() {
  'use strict';

  // 1. Active navigation highlighting
  document.addEventListener('DOMContentLoaded', function() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-links a');
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    // 2. Last-updated date injection
    var lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = '2026-07-12';
    }

    // 3. Simple table filter
    var filterInput = document.getElementById('table-filter');
    if (filterInput) {
      filterInput.addEventListener('input', function() {
        var q = this.value.toLowerCase();
        var rows = document.querySelectorAll('.dr-table tbody tr');
        rows.forEach(function(row) {
          var text = row.textContent.toLowerCase();
          row.style.display = text.indexOf(q) !== -1 ? '' : 'none';
        });
      });
    }
  });
})();
