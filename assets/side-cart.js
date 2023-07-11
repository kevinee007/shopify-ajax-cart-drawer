class PromoBar {
  constructor(el) {
    this.promoContainer = el;
    this.promoMsgBefore =
      this.promoContainer.querySelector(".promo-msg.before");
    this.promoMsgAfter = this.promoContainer.querySelector(".promo-msg.after");
    this.promoMeter = this.promoContainer.querySelector(
      ".promo-meter .meter-indicator"
    );

    this.PROMO_THRESHOLD = parseInt(this.promoContainer.dataset.threshold);
    this.PROMO_THRESHOLD_TYPE = this.promoContainer.dataset.thresholdType;
    this.PROMO_THRESHOLD_PRODUCT_ID =
      this.promoContainer.dataset.thresholdProductId;

    this.init();
  }

  async init() {
    const cartData = await this.getCart();
    this.reRender(cartData);
  }

  async getCart() {
    try {
      const response = await fetch("/cart.js");
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
  }

  getGiftCardPrices(cartData) {
    let giftCardPrices = 0;

    const giftCards = cartData.items.filter(
      (item) => item.handle === "gift-card"
    );

    if (giftCards.length > 0) {
      giftCardPrices = giftCards
        .map((giftCard) => giftCard.final_line_price)
        .reduce((curr, acc) => curr + acc);
    }

    return giftCardPrices;
  }

  updatePromoMsgBefore(message) {
    const thresholdMessageEl =
      this.promoMsgBefore.querySelector(".promo-threshold");
    if (!thresholdMessageEl) return;

    this.promoMsgBefore.querySelector(".promo-threshold").textContent = message;
  }

  reRender(cartData) {
    let aboveThreshold = false;
    let difference = 0;
    let beforeMessage = "";

    if (
      this.PROMO_THRESHOLD_TYPE === "product" &&
      this.PROMO_THRESHOLD_PRODUCT_ID
    ) {
      // Specific Product in Cart
      // difference == number of matching items in cart
      const matchingLineItems = cartData.items.filter((item) =>
        this.PROMO_THRESHOLD_PRODUCT_ID.includes(item.product_id)
      );

      matchingLineItems.forEach((item) => {
        difference = difference + item.quantity;
      });

      aboveThreshold = difference >= this.PROMO_THRESHOLD;
      beforeMessage = this.PROMO_THRESHOLD - difference;
    } else {
      // Minimum Cart Value
      const giftCardPrices = this.getGiftCardPrices(cartData);
      difference = cartData.total_price - giftCardPrices;
      aboveThreshold =
        cartData.total_price - giftCardPrices >= this.PROMO_THRESHOLD;
      beforeMessage =
        "$" + ((this.PROMO_THRESHOLD - difference) / 100).toFixed(2);
    }

    this.updatePromoMsgBefore(beforeMessage);

    if (aboveThreshold) {
      this.promoMsgBefore.style.display = "none";
      this.promoMsgAfter.style.display = "block";
    } else {
      this.promoMsgBefore.style.display = "block";
      this.promoMsgAfter.style.display = "none";
    }

    const percentage = ((difference / this.PROMO_THRESHOLD) * 100).toFixed(0);
    this.promoMeter.style.width = percentage > 100 ? "100%" : `${percentage}%`;
  }
}

class SideCart extends HTMLElement {
  constructor() {
    super();

    // components to initialize cart functionality
    this.cartBubble = document.querySelector("header #cart-icon-bubble");
    this.closeBtn = this.querySelector("#closecart");
    this.cartOverlay = this.querySelector(".sidecart__overlay");

    // components to be updated every time there is a cart action
    this.sidecartItems = this.querySelector(
      ".sidecart__items .sidecart__items-wrapper"
    );
    // this.sidecartUpsell = this.querySelector(".sidecart__upsell");
    this.cartFooter = this.querySelector(".sidecart__footer");
    this.emptyCart = this.querySelector(".sidecart__empty");
    this.shippingContainer = this.querySelector(".sidecart__shipping");
    this.shippingMsg = this.querySelector(".sidecart__shipping .shipping-msg");
    this.shippingMeter = this.querySelector(".shipping-meter .meter-indicator");

    const promoEls = this.querySelectorAll(".sidecart__promo");
    this.promos = [];

    promoEls.forEach((promoEl) => {
      this.promos.push(new PromoBar(promoEl));
    });

    // Constants
    this.CARTROUTES = "/cart";
    this.FREESHIPPING = 5000;
    this.LOADINGICON = this.loadingIcon();

    this.init();
  }

  async init() {
    this.cartBubble.addEventListener("click", this.openCart.bind(this));
    this.cartBubble.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCart.bind(this);
    });
    this.closeBtn.addEventListener("click", this.closeCart.bind(this));
    this.cartOverlay.addEventListener("click", this.closeCart.bind(this));
  }

  openCart(event) {
    this.classList.add("cart--open");
    document.querySelector("body").classList.add("overflow-hidden");
    const widget = document.querySelector(".weglot-container.wg-default");
    if (widget) {
      widget.style.display = "none";
    }
  }

  closeCart(event) {
    event.preventDefault();
    this.classList.remove("cart--open");
    document.querySelector("body").classList.remove("overflow-hidden");
    const widget = document.querySelector(".weglot-container.wg-default");
    if (widget) {
      widget.style.display = "block";
    }
  }

  // functions returning constant values
  loadingIcon() {
    return `
    <?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; background: rgb(255, 255, 255) none repeat scroll 0% 0%; display: block; shape-rendering: auto;" width="80px" height="80px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" cy="50" fill="none" stroke="#008FBB" stroke-width="5" r="35" stroke-dasharray="164.93361431346415 56.97787143782138">
      <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="0.7692307692307692s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform>
    </circle>
    <!-- [ldio] generated by https://loading.io/ --></svg>
    `;
  }
  discountIcon() {
    return `
    <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-discount color-foreground-{{ settings.accent_icons }}" viewBox="0 0 12 12">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0h3a2 2 0 012 2v3a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l6-6A1 1 0 017 0zm2 2a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor">
    </svg>
    `;
  }

  async addToCart(itemId, quantity = 1, itemProps = {}) {
    const updates = {
      items: [
        {
          quantity,
          id: itemId,
          properties: itemProps,
        },
      ],
    };
    const properties = {
      ...fetchConfig("javascript"),
      body: JSON.stringify(updates),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/add.js",
        properties
      );

      const data = await response.json();

      // get the cart data
      await this.getCart();
    } catch (err) {
      console.error(err);
    }
  }

  async addItemsToCart(items) {
    const updates = {
      items: items.map((item) => {
        return {
          quantity: item.quantity,
          id: item.id,
          properties: item.property,
        };
      }),
    };
    const properties = {
      ...fetchConfig("javascript"),
      body: JSON.stringify(updates),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/add.js",
        properties
      );
      const data = await response.json();
      // get the cart data
      await this.getCart();
    } catch (err) {
      console.error(err);
    }
  }

  async addSubscriptionsToCart(items) {
    const updates = {
      items: items.map((item) => {
        return {
          quantity: item.quantity,
          selling_plan: item.selling_plan,
          id: item.id,
          properties: item.property,
        };
      }),
    };
    const properties = {
      ...fetchConfig("javascript"),
      body: JSON.stringify(updates),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/add.js",
        properties
      );
      const data = await response.json();

      // get the cart data
      await this.getCart();
    } catch (err) {
      console.error(err);
    }
  }

  async getCart() {
    try {
      const response = await fetch("/cart.js");
      const data = await response.json();
      await this.reRenderCart(data);
      this.openCart();
      return data;
    } catch (err) {
      console.error(err);
    }
  }

  async multiupdateCart(lineQuantities) {
    const properties = {
      ...fetchConfig("javascript"),
      body: JSON.stringify({ updates: lineQuantities }),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/update.js",
        properties
      );
      const data = await response.json();

      if (data) {
        await this.reRenderCart(data);
      }
      return data;
    } catch (err) {
      console.error("Error while updating", err);
      return null;
    }
  }

  async updateCart(variantId, lineIndex = null, quantity) {
    const updates =
      lineIndex !== null
        ? {
            line: lineIndex,
            quantity,
          }
        : { id: variantId, quantity };

    const properties = {
      ...fetchConfig("javascript"),
      body: JSON.stringify(updates),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/change.js",
        properties
      );
      const data = await response.json();

      if (data) {
        await this.reRenderCart(data);
      }
      return data;
    } catch (err) {
      console.error("Error while updating", err);
      return null;
    }
  }

  async reRenderCart(cartData) {
    const itemCount = cartData.item_count;
    if (itemCount <= 0 && this.sidecartItems) {
      this.cartFooter.innerHTML = "";
      this.sidecartItems.innerHTML = "";
      this.emptyCart.innerHTML = this.renderEmptyCart();
    } else {
      this.emptyCart.innerHTML = "";
      this.renderItems(cartData);
      this.cartFooter.innerHTML = this.renderFooter(cartData);
    }

    this.reRenderShipping(cartData);

    this.promos.forEach((promo) => {
      promo.reRender(cartData);
    });

    const cartCountBubble = this.cartBubble.querySelector(".cart-count-bubble");
    cartCountBubble.innerHTML = this.reRenderBubble(itemCount);
  }

  renderItems(cartData) {
    // this executes if the cart is empty (only initial page load)
    if (!this.sidecartItems) {
      this.querySelector(
        ".sidecart__items"
      ).innerHTML = `<div class="sidecart__items-wrapper"></div><div class="sidecart__items-wrapper--upsell"></div>`;
    }
    // reinitialize sidecartItems
    this.sidecartItems = this.querySelector(
      ".sidecart__items .sidecart__items-wrapper"
    );

    const discountIcon = this.discountIcon();

    const newItemsHTML = cartData.items.map((itemData, index) => {
      if (!itemData.properties) {
        itemData.properties = {};
      }
      return `
		<side-cart-item data-variant-id="${itemData.id}"
		  data-line-index="${index + 1}"
		  ${
        Object.keys(itemData.properties).length !== 0
          ? `data-bundle-id="${
              itemData.properties[Object.keys(itemData.properties)[0]]
            }"`
          : ""
      }>
          <div class="action-loading">
            ${this.LOADINGICON}
          </div>
          <div class="sidecart__img">
            <img src=" ${this.initImageSize(itemData.image)}">
          </div>
          <div class="sidecart__info">
            <div class="sidecart__info-titlesection">
              <a class="item-title" href="${itemData.url}">${
        itemData.product_title
      }</a>
              ${
                itemData.variant_title &&
                itemData.variant_title !== "Default Title"
                  ? `<p class="item-variant-title">${itemData.variant_title}</p>`
                  : ""
              }
            </div>
			${
        itemData.final_price != 0 || itemData.discounts.length != 0
          ? `
              <div class="sidecart__info-pricing">
                <p class="item-price"><span class="money">${window.currencySymbol}${(
                  itemData.final_price / 100
                ).toFixed(2)}</span></p>
			  </div>`
          : ""
      }
          </div>
          <div class="sidecart__buttons">
			${
        itemData.final_price != 0 || itemData.discounts.length != 0
          ? `
				<a class="item-remove qty-controller" data-update-type="remove">Remove</a>`
          : ""
      }
			${
        Object.keys(itemData.properties).length === 0
          ? `
              <div class="sidecart__qty-control">
                <button class="btn item-qty-btn qty-controller" data-update-type="minus">−</button>
                <input class="itemQty" id="itemQty" type="number" value="${
                  itemData.quantity
                }" disabled />
                <button class="btn item-qty-btn qty-controller" data-update-type="plus" ${
                  itemData.product_id === 7413146779847 &&
                  itemData.quantity === 4
                    ? "disabled"
                    : null
                }>+</button>
               </div>`
          : `
                <div class="sidecart__qty-control static-qty">
                 <span class="qty-label">Qty: </span>
                 <input class="itemQty" id="itemQty" type="number" value="${itemData.quantity}" disabled />
               </div>
             `
      }
          </div>
          ${
            itemData.line_level_discount_allocations &&
            itemData.line_level_discount_allocations.length > 0
              ? `<ul class="item-discounts">
              ${itemData.line_level_discount_allocations
                .map((discount) => {
                  return `
                  <li>
                    ${discountIcon}
                    <span class="discount-info">
                      ${discount.discount_application.title}(-${window.currencySymbol}${(
                    discount.discount_application.total_allocated_amount / 100
                  ).toFixed(2)})
                    </span>
                  </li>`;
                })
                .join("")}
            </ul>`
              : ""
          }
            ${itemData.product_id === 7413146779847 ? "" : ""}
        </side-cart-item>
      `;
    });

    this.sidecartItems.innerHTML = newItemsHTML.join("");
  }

  initImageSize(src) {
    if (src) {
      if (
        src.includes(".png") ||
        src.includes(".PNG") ||
        src.includes(".jpg") ||
        src.includes(".jpg")
      ) {
        const lastIndex = src.lastIndexOf(".");
        const before = src.slice(0, lastIndex);

        const after = src.slice(lastIndex + 1);

        const newSrc = before + "_150x." + after;
        return newSrc;
      } else {
        return src;
      }
    } else {
      return "https://cdn.shopify.com/shopifycloud/shopify/assets/no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_200x.gif";
    }
  }

  renderOptions(v) {
    if (v.title == "32 Capsules" || v.title == "36 Capsules") {
      if (v.inventory_quantity > 0) {
        return `<option value="${v.id}" class="large_package" data-price="${v.price}">${v.title}</option>`;
      } else {
        return `<option disabled value="${v.id}" class="large_package" data-price="${v.price}">${v.title}</option>`;
      }
    } else {
      if (v.inventory_quantity > 0) {
        return `<option value="${v.id}" data-price="${v.price}">${v.title}</option>`;
      } else {
        return `<option disabled value="${v.id}" data-price="${v.price}">${v.title}</option>`;
      }
    }
  }

  renderOptionAdventCalendar(v) {
    if (v.inventory_quantity > 0) {
      return `<option value="${v.id}" data-price="${v.price}">${v.title}</option>`;
    } else {
      return `<option disabled value="${v.id}" data-price="${v.price}">${v.title}</option>`;
    }
  }

  variantsLocalization(variants) {
    let isVariantsHas6or36 = false;
    variants.forEach((v) => {
      if (v.title == "6 Capsules" || v.title == "36 Capsules") {
        if (v.inventory_quantity > 0) {
          isVariantsHas6or36 = true;
        }
      }
    });
    return variants.map((v) => {
      if (window.geolocation == "Canada") {
        if (v.title == "8 Capsules" || v.title == "32 Capsules") {
          return this.renderOptions(v);
        }
      } else {
        if (isVariantsHas6or36) {
          if (v.title == "6 Capsules" || v.title == "36 Capsules") {
            return this.renderOptions(v);
          }
        } else {
          return this.renderOptions(v);
        }
      }
    });
  }

  renderFooter(cartData) {
    const updatedFooterHTML = `
      <div class="sidecart__footer-wrapper">
        <div class="footer__subtotal">
          <p class="subtotal-label">Subtotal</p>
          <p class="subtotal-price"><span class="money">${window.currencySymbol}${(
            cartData.total_price / 100
          ).toFixed(2)}</span></p>
        </div>
        <div class="footer__disclaimer">
          <p>
            Taxes and <a href="/policies/shipping-policy">shipping</a> calculated at checkout
          </p>
        </div>
        <div class="custom-checkout-container">
          <a class="custom-checkout-btn" href="/checkout">CHECKOUT</a>
        </div>
      </div>
    `;
    return updatedFooterHTML;
  }

  renderEmptyCart() {
    const updatedEmptyHTML = `
      <div class="sidecart__empty-wrapper">
        <p class="empty-msg">Your cart is currently empty.</p>
      </div>
    `;
    return updatedEmptyHTML;
  }

  reRenderShipping(cartData) {
    const noShipping =
      cartData.items.filter((item) => item.product_id == "7249102143687")
        .length > 0
        ? true
        : false;
    if (this.shippingContainer.style.display != "none") {
      if (noShipping) {
        this.shippingContainer.style.display = "none";
        return;
      } else {
        this.shippingContainer.style.display = "block";
      }
    }

    let giftCardPrices = 0;
    let adventCalendarPrices = 0;

    const giftCards = cartData.items.filter(
      (item) => item.handle === "gift-card"
    );
    if (giftCards.length > 0) {
      giftCardPrices = giftCards
        .map((giftCard) => giftCard.final_line_price)
        .reduce((curr, acc) => curr + acc);
    }

    const adventCalendars = cartData.items.filter(
      (item) => item.product_id === 7413146779847
    );
    if (adventCalendars.length > 0) {
      adventCalendarPrices = adventCalendars
        .map((adventCalendar) => adventCalendar.final_line_price)
        .reduce((curr, acc) => curr + acc);
    }

    const cartMsgUpdated = `
      ${
        cartData.total_price - giftCardPrices < this.FREESHIPPING
          ? `You're <span class="shipping-threshold">${window.currencySymbol}${(
              (this.FREESHIPPING - (cartData.total_price - giftCardPrices)) /
              100
            ).toFixed(2)}</span> from free shipping!`
          : "You qualify for free shipping!"
      }
    `;
    this.shippingMsg.innerHTML = cartMsgUpdated;
    // const percentage = ((cartData.total_price - giftCardPrices - adventCalendarPrices) / this.FREESHIPPING * 100).toFixed(0);
    const percentage = (
      ((cartData.original_total_price - giftCardPrices) / this.FREESHIPPING) *
      100
    ).toFixed(0);
    this.shippingMeter.style.width =
      percentage > 100 ? "100%" : `${percentage}%`;
  }

  reRenderBubble(itemCount) {
    const updatedBubbleHTML = `
      <span aria-hidden="true">${itemCount <= 10 ? itemCount : "10+"}</span>
      <span class="visually-hidden">${
        itemCount == 1 ? `${itemCount} item` : `${itemCount} items`
      }</span>
    `;
    return updatedBubbleHTML;
  }
}

customElements.define("side-cart", SideCart);

class SideCartItem extends HTMLElement {
  constructor() {
    super();

    this.loadingScreen = this.querySelector(".action-loading");
    this.variantId = this.dataset.variantId;
    this.lineIndex = this.dataset.lineIndex;
    this.sideCart = this.closest("side-cart");
    this.qtyInput = this.querySelector("#itemQty");
    this.qtyButtons = this.querySelectorAll(
      ".sidecart__buttons .qty-controller"
    );
    this.init();
  }

  init() {
    if (this.qtyButtons && this.qtyButtons.length > 0) {
      this.qtyButtons.forEach((qtybtn) => {
        qtybtn.addEventListener("click", this.qtyBtnClick.bind(this, qtybtn));
      });
    }
  }

  async removeBundleProducts(bundleId) {
    var lineQuantities = [];
    localStorage.setItem("existSubscriptionInfoSideCart", false);
    $(".subscription-btn[has-subscription=true]").attr(
      "has-subscription",
      false
    );
    // Create an array for line updates - each number in the array sets the quantity for the corresponding
    // line item in the cart (e.g. array[1] matches the second line item)
    this.sideCart.querySelectorAll("side-cart-item").forEach((item, index) => {
      item.dataset.bundleId
        ? lineQuantities.push(0)
        : lineQuantities.push(item.qtyInput.value);
    });

    this.loadingScreen.classList.add("loading");

    const sideCart = this.sideCart;
    const cartData = await sideCart.multiupdateCart(lineQuantities);

    this.loadingScreen.classList.remove("loading");
  }

  qtyBtnClick(qtybtn, event) {
    // event.preventDefault();

    const variantId = this.variantId;
    const lineIndex = this.lineIndex;
    const updateType = qtybtn.dataset.updateType;
    const variantQty = this.qtyInput ? parseInt(this.qtyInput.value) : 1;
    const bundleId = this.dataset.bundleId;

    if (bundleId) {
      this.removeBundleProducts(bundleId);
      return;
    }

    if (!variantQty || isNaN(variantQty)) {
      return;
    } else {
      switch (updateType) {
        case "remove":
          this.updateQuantity(variantId, lineIndex, 0);
          break;
        case "minus":
          this.updateQuantity(variantId, lineIndex, variantQty - 1);
          break;
        case "plus":
          this.updateQuantity(variantId, lineIndex, variantQty + 1);
          break;
        default:
          // don't do anything if button updatetype attribute doesn't belong to any of the cases above
          return;
      }
    }
  }

  async updateQuantity(
    variantId,
    lineIndex = null,
    variantQty,
    alreadyUpdated = false
  ) {
    // toggle loading screen
    this.loadingScreen.classList.add("loading");

    if (!alreadyUpdated) {
      const sideCart = this.sideCart;
      const cartData = await sideCart.updateCart(
        variantId,
        lineIndex,
        variantQty
      );
    }

    this.loadingScreen.classList.remove("loading");
  }
}

customElements.define("side-cart-item", SideCartItem);