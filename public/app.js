/**
 * StayEase frontend. Vanilla JS, no build step. Talks to the REST API in
 * src/app.ts. Data-test attributes are added to key elements so the Playwright
 * MCP-driven E2E tests can target them reliably.
 */

const els = {
  searchForm: document.getElementById('search-form'),
  checkIn: document.getElementById('checkIn'),
  checkOut: document.getElementById('checkOut'),
  guests: document.getElementById('guests'),
  searchError: document.getElementById('search-error'),
  resultsHeading: document.getElementById('results-heading'),
  results: document.getElementById('results'),
  modal: document.getElementById('booking-modal'),
  modalClose: document.getElementById('modal-close'),
  bookingSummary: document.getElementById('booking-summary'),
  bookingForm: document.getElementById('booking-form'),
  roomTypeId: document.getElementById('roomTypeId'),
  guestName: document.getElementById('guestName'),
  guestEmail: document.getElementById('guestEmail'),
  bookingError: document.getElementById('booking-error'),
  confirmation: document.getElementById('confirmation'),
  confirmationDetail: document.getElementById('confirmation-detail'),
};

let currentSearch = { checkIn: '', checkOut: '', guests: 1 };

function formatMoney(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Sensible default dates: tomorrow for 2 nights.
els.checkIn.value = todayPlus(1);
els.checkOut.value = todayPlus(3);

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function clearError(el) {
  el.textContent = '';
  el.hidden = true;
}

async function searchRooms(event) {
  event.preventDefault();
  clearError(els.searchError);

  const checkIn = els.checkIn.value;
  const checkOut = els.checkOut.value;
  const guests = Number(els.guests.value);

  if (!checkIn || !checkOut) {
    showError(els.searchError, 'Please select both check-in and check-out dates.');
    return;
  }
  if (checkOut <= checkIn) {
    showError(els.searchError, 'Check-out must be after check-in.');
    return;
  }

  currentSearch = { checkIn, checkOut, guests };

  const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
  try {
    const res = await fetch(`/api/availability?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      showError(els.searchError, (data.errors && data.errors[0] && data.errors[0].message) || 'Search failed.');
      return;
    }
    renderResults(data.results);
  } catch {
    showError(els.searchError, 'Network error. Please try again.');
  }
}

function renderResults(results) {
  els.resultsHeading.hidden = false;
  els.results.innerHTML = '';

  if (!results || results.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.setAttribute('data-test', 'no-results');
    empty.textContent = 'No rooms available for those dates and guest count. Try adjusting your search.';
    els.results.appendChild(empty);
    return;
  }

  for (const r of results) {
    const card = document.createElement('article');
    card.className = 'room-card';
    card.setAttribute('data-test', 'room-card');
    card.setAttribute('data-room-id', r.roomType.id);

    const amenities = r.roomType.amenities
      .map((a) => `<li>${a}</li>`)
      .join('');

    card.innerHTML = `
      <div class="room-card-body">
        <h3 class="room-name">${r.roomType.name}</h3>
        <p class="room-desc">${r.roomType.description}</p>
        <ul class="amenities">${amenities}</ul>
        <p class="total-line">${r.nights} night(s) · <span data-test="total">${formatMoney(r.totalCents)}</span> total</p>
        <p class="availability" data-test="availability">${r.roomsAvailable} room(s) left</p>
        <div class="room-meta">
          <span class="price">${formatMoney(r.roomType.priceCents)} <small>/ night</small></span>
          <button class="btn btn-primary" data-test="book-btn" data-room-id="${r.roomType.id}" data-room-name="${r.roomType.name}" data-total="${r.totalCents}">Book</button>
        </div>
      </div>
    `;
    els.results.appendChild(card);
  }

  els.results.querySelectorAll('[data-test="book-btn"]').forEach((btn) => {
    btn.addEventListener('click', () => openBooking(btn.dataset.roomId, btn.dataset.roomName, Number(btn.dataset.total)));
  });
}

function openBooking(roomId, roomName, totalCents) {
  clearError(els.bookingError);
  els.roomTypeId.value = roomId;
  els.bookingSummary.textContent = `${roomName} · ${currentSearch.checkIn} → ${currentSearch.checkOut} · ${formatMoney(totalCents)} total`;
  els.modal.hidden = false;
  els.guestName.focus();
}

function closeBooking() {
  els.modal.hidden = true;
  els.bookingForm.reset();
}

async function submitBooking(event) {
  event.preventDefault();
  clearError(els.bookingError);

  const payload = {
    roomTypeId: els.roomTypeId.value,
    guestName: els.guestName.value,
    guestEmail: els.guestEmail.value,
    checkIn: currentSearch.checkIn,
    checkOut: currentSearch.checkOut,
    guests: currentSearch.guests,
  };

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(els.bookingError, (data.errors && data.errors[0] && data.errors[0].message) || 'Booking failed.');
      return;
    }
    closeBooking();
    showConfirmation(data.booking);
    // Refresh availability so counts reflect the new booking.
    els.searchForm.requestSubmit();
  } catch {
    showError(els.bookingError, 'Network error. Please try again.');
  }
}

function showConfirmation(booking) {
  els.confirmationDetail.textContent = `Confirmation ${booking.id.slice(0, 8)} · ${formatMoney(booking.totalCents)} for ${booking.nights} night(s).`;
  els.confirmation.hidden = false;
  setTimeout(() => {
    els.confirmation.hidden = true;
  }, 6000);
}

els.searchForm.addEventListener('submit', searchRooms);
els.bookingForm.addEventListener('submit', submitBooking);
els.modalClose.addEventListener('click', closeBooking);
els.modal.addEventListener('click', (e) => {
  if (e.target === els.modal) closeBooking();
});
