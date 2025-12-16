

/* Main-page cart script
   - Adds "Add to Cart" button to each .card (if not present)
   - Prevents duplicate adds (item stored once)
   - Updates button to "Added ✓" and disables it after add
   - Persists cart in localStorage under key COURSE_CART_V2
   - Renders a "View Cart" button with item count that links to cart.html
*/

(function () {
  const CART_KEY = 'COURSE_CART_V2';

  // Helpers
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from((root || document).querySelectorAll(s));
  const norm = s => (s || '').toString().trim();

  // Escape HTML for safe insertion
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Load/save cart
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderViewCartButton();
  }

  // Parse course info from a card element (robust to your markup)
  function parseCard(card) {
    const body = qs('.card-body', card) || card;
    // Title: choose the h4 that is not inside .ctos (price area)
    const h4s = qsa('h4', body);
    let title = '';
    if (h4s.length === 1) title = norm(h4s[0].textContent);
    else if (h4s.length > 1) {
      const candidate = h4s.find(h => !h.closest('.ctos'));
      title = norm((candidate || h4s[0]).textContent);
    }

    // Category: prefer .ctos2 h6#cbo or first h6 inside .ctos2
    let category = '';
    const ctos2 = qs('.ctos2', body);
    if (ctos2) {
      const catEl = qs('h6#cbo, h6', ctos2);
      if (catEl) category = norm(catEl.textContent);
    }
    if (!category) {
      const fallback = qs('h6#cbo', card);
      if (fallback) category = norm(fallback.textContent);
    }

    // Price: h4 inside .ctos
    let priceText = '';
    const priceEl = qs('.ctos h4', body);
    if (priceEl) priceText = norm(priceEl.textContent);
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

    // Hours (optional)
    let hours = '';
    const cboBlocks = qsa('.cbo', body);
    if (cboBlocks.length) {
      const lastCbo = cboBlocks[cboBlocks.length - 1];
      const hourEl = qs('h6', lastCbo);
      if (hourEl) hours = norm(hourEl.textContent);
    }

    // Create a stable id (slug of title + price)
    const id = (title + '|' + price).replace(/\s+/g, '_');

    return { id, title, category, price, hours, element: card };
  }

  // Add "Add to Cart" buttons and wire them
  const cards = qsa('.card');
  const courses = cards.map(parseCard);

  // Create View Cart button area
  const cartActions = qs('#cart-actions') || (function () {
    const d = document.createElement('div');
    d.id = 'cart-actions';
    document.body.insertBefore(d, document.body.firstChild);
    return d;
  })();

  function renderViewCartButton() {
    const cart = loadCart();
    const count = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
    cartActions.innerHTML = `
      <a id="view-cart-link" href="cart.html" style="display:inline-block;padding:8px 12px;border-radius:6px;background:white;color:black;text-decoration:none;">
         <i class="bi bi-cart3" ></i> (${count})
      </a>
    `;
  }

  // Initialize buttons on cards
  courses.forEach(course => {
    const card = course.element;
    // Avoid duplicate button insertion
    if (qs('.add-to-cart-btn', card)) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-to-cart-btn';
    btn.textContent = 'Add to Cart';
    // btn.style.marginTop = '8px';
    // btn.style.padding = '6px 10px';
    // btn.style.borderRadius = '6px';
    // btn.style.border = '1px solid #0078d4';
    // btn.style.background = '#0078d4';
    // btn.style.color = '#fff';
    btn.style.cursor = 'pointer';

    // Append button to card-body
    const body = qs('.card-body', card) || card;
    body.appendChild(btn);

    // If item already in cart, mark as added
    const cart = loadCart();
    if (cart[course.id]) {
      btn.textContent = 'Added ✓';
      btn.disabled = true;
      btn.style.opacity = '0.8';
      btn.style.cursor = 'default';
    }

    // Click handler
    btn.addEventListener('click', () => {
      const current = loadCart();
      if (current[course.id]) {
        // already added — ensure UI reflects that
        btn.textContent = 'Added ✓';
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.style.cursor = 'default';
        return;
      }
      // Add item once with qty 1
      current[course.id] = {
        id: course.id,
        title: course.title,
        category: course.category,
        price: course.price,
        qty: 1,
        hours: course.hours || ''
      };
      saveCart(current);

      // Update button UI to show added
      btn.textContent = 'Added ✓';
      btn.disabled = true;
      btn.style.opacity = '0.8';
      btn.style.cursor = 'default';

      // Small visual feedback: flash border
      card.style.transition = 'box-shadow 220ms';
      card.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
      setTimeout(() => { card.style.boxShadow = ''; }, 400);
    });
  });

  // Initial render of view cart button
  renderViewCartButton();

  // Expose small API for debugging
  window.__courseCartMain = {
    getCart: loadCart,
    clearCart: () => { localStorage.removeItem(CART_KEY); renderViewCartButton(); }
  };
})();

// Search and filter function
function search() {
    const input = document.getElementById("searchitem").value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const title = card.querySelector("h4").textContent.toLowerCase();
        const category = card.querySelector("#cbo").textContent.toLowerCase();
        if (title.includes(input) || category.includes(input)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// Category filter
document.querySelectorAll(".topc button").forEach(button => {
    button.addEventListener("click", () => {
        const category = button.textContent.trim().toLowerCase();
        const cards = document.querySelectorAll(".card");

        cards.forEach(card => {
            const cardCategory = card.querySelector("#cbo").textContent.toLowerCase();
            if (category === "all" || cardCategory === category) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });

        // Clear search input when category is selected
        document.getElementById("searchitem").value = "";
    });
});




        // Get the button:
let mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


