if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
        this.sideCart = document.querySelector("side-cart");
        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

        let thisQty;
        if (this.form.querySelector("quantity-input input")) {
          thisQty = this.form.querySelector("quantity-input input").value;
        } else {
          thisQty = 1;
        }

        const body = JSON.stringify({
          ...JSON.parse(serializeForm(this.form, thisQty))
        });

        const itemJson = JSON.parse(body);
        const varId = itemJson.id,
              varqty = parseInt(itemJson.quantity);
        
        await this.sideCart.addToCart(varId, varqty);

        this.submitButton.setAttribute('aria-disabled', false);
        this.submitButton.classList.remove('loading');
      }
    }
  );
}
