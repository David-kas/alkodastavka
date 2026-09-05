/** Модальное окно «Заказ в один клик» — вставляется перед </body> на всех страницах. */
export const ONECLICK_MODAL_HTML = `<div id="oneclick-backdrop" class="oneclick-backdrop" hidden></div>
<div id="oneclick-modal" class="oneclick-modal" hidden role="dialog" aria-labelledby="oneclick-title" aria-modal="true">
  <div class="oneclick-modal-inner">
    <button type="button" class="oneclick-close" id="oneclick-close" aria-label="Закрыть">×</button>
    <h2 id="oneclick-title">Заказ в один клик</h2>
    <p class="oneclick-lead">Укажите имя и телефон — менеджер перезвонит в течение нескольких минут.</p>
    <form id="oneclick-order-form" class="oneclick-form" data-telegram-form data-source="Заказ 1 клик на сайте" data-order-type="⚡ Заказ в один клик">
      <label class="oneclick-field">
        <span class="oneclick-label">Ваше имя</span>
        <input type="text" name="name" id="oneclick-name" placeholder="Как к вам обращаться" autocomplete="name" required>
      </label>
      <label class="oneclick-field">
        <span class="oneclick-label">Телефон</span>
        <input type="tel" name="phone" id="oneclick-phone" placeholder="+7 (999) 000-00-00" autocomplete="tel" required>
      </label>
      <button type="submit" class="btn btn-large oneclick-submit">Сделать заказ</button>
    </form>
    <div id="oneclick-status" class="oneclick-status" data-order-status role="status" aria-live="polite"></div>
    <p class="oneclick-note">18+ · доставка по Москве 24/7</p>
  </div>
</div>
<script>
(function () {
  function initOneClickTelegram() {
    var form = document.getElementById('oneclick-order-form');
    if (!form || form.dataset.telegramFixed === '1') return;
    form.dataset.telegramFixed = '1';

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      var nameInput = form.querySelector('[name="name"]');
      var phoneInput = form.querySelector('[name="phone"]');
      var status = document.getElementById('oneclick-status');
      var button = form.querySelector('button[type="submit"]');
      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';

      if (!name || !phone) {
        if (nameInput && !name) nameInput.focus();
        else if (phoneInput) phoneInput.focus();
        return;
      }

      if (status) {
        status.textContent = '⏳ Отправка заявки...';
        status.style.color = '#333';
      }
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }

      try {
        var response = await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            phone: phone,
            comment: 'Заказ в один клик',
            source: 'Заказ 1 клик на сайте',
            orderType: form.getAttribute('data-order-type') || '⚡ Заказ в один клик',
            pageUrl: window.location.href
          })
        });

        var result = {};
        try { result = await response.json(); } catch (_) {}

        if (response.ok && result.success) {
          if (status) {
            status.textContent = '✅ Заявка отправлена! Мы скоро перезвоним.';
            status.style.color = '#2e7d32';
          }
          form.reset();
          window.setTimeout(function () {
            var modal = document.getElementById('oneclick-modal');
            var backdrop = document.getElementById('oneclick-backdrop');
            if (modal) modal.hidden = true;
            if (backdrop) backdrop.hidden = true;
            document.body.classList.remove('oneclick-open');
          }, 2200);
        } else {
          var message = result.error || 'Не удалось отправить заявку';
          if (result.code === 'TELEGRAM_NOT_CONFIGURED') {
            message = 'Telegram временно не настроен. Позвоните +7 (925) 121-99-72.';
          }
          if (status) {
            status.textContent = '❌ ' + message;
            status.style.color = '#d32f2f';
          }
        }
      } catch (_) {
        if (status) {
          status.textContent = '❌ Ошибка соединения. Позвоните +7 (925) 121-99-72.';
          status.style.color = '#d32f2f';
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOneClickTelegram, { once: true });
  } else {
    initOneClickTelegram();
  }
})();
</script>`;
