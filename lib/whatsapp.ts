export interface WhatsAppOrderItem {
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

export interface WhatsAppOrder {
  items: WhatsAppOrderItem[];
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}

export class WhatsAppService {
  private static phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || '';

  static formatOrderMessage(order: WhatsAppOrder): string {
    const { items, customerName, customerPhone, customerEmail, shippingAddress, notes } = order;

    let message = `🛍️ *NUEVO PEDIDO - MILO*\n\n`;
    
    // Customer information
    message += `👤 *Cliente:* ${customerName}\n`;
    if (customerPhone) message += `📱 *Teléfono:* ${customerPhone}\n`;
    if (customerEmail) message += `📧 *Email:* ${customerEmail}\n`;
    message += `\n`;

    // Items
    message += `🛒 *Productos:*\n`;
    let total = 0;
    
    items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio: $${item.price.toFixed(2)}\n`;
      if (item.sku) message += `   SKU: ${item.sku}\n`;
      message += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
    });

    message += `💰 *Total: $${total.toFixed(2)}*\n\n`;

    // Shipping address
    if (shippingAddress) {
      message += `📦 *Dirección de Envío:*\n`;
      message += `${shippingAddress.street}\n`;
      message += `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\n`;
      message += `${shippingAddress.country}\n\n`;
    }

    // Notes
    if (notes) {
      message += `📝 *Notas:* ${notes}\n\n`;
    }

    message += `⏰ *Fecha:* ${new Date().toLocaleString('es-ES')}\n`;

    return message;
  }

  static generateWhatsAppURL(order: WhatsAppOrder): string {
    const message = this.formatOrderMessage(order);
    const encodedMessage = encodeURIComponent(message);
    
    // Use WhatsApp Web URL with the business phone number
    const phoneNumber = this.phoneNumber.replace(/\D/g, ''); // Remove non-digits
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }

  static generateWhatsAppLink(order: WhatsAppOrder): string {
    const message = this.formatOrderMessage(order);
    const encodedMessage = encodeURIComponent(message);
    
    // For mobile apps, use the whatsapp:// protocol
    const phoneNumber = this.phoneNumber.replace(/\D/g, '');
    return `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
  }

  static createOrderFromCart(cartItems: any[], customerInfo: any): WhatsAppOrder {
    const items: WhatsAppOrderItem[] = cartItems.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.sku,
    }));

    return {
      items,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email,
      shippingAddress: customerInfo.shippingAddress,
      notes: customerInfo.notes,
    };
  }

  static formatItemForSharing(item: any): string {
    let message = `🛍️ *${item.name}* - MILO\n\n`;
    
    if (item.description) {
      message += `📝 ${item.description}\n\n`;
    }
    
    message += `💰 *Precio:* $${item.price}\n`;
    
    if (item.comparePrice && item.comparePrice > item.price) {
      const discount = Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100);
      message += `🏷️ *Precio regular:* ~$${item.comparePrice}~ (${discount}% OFF)\n`;
    }
    
    if (item.coleccion) {
      message += `📂 *Colección:* ${item.coleccion.name}\n`;
    }
    
    message += `\n¿Te interesa? ¡Contáctanos para más información!`;
    
    return message;
  }

  static generateItemShareURL(item: any): string {
    const message = this.formatItemForSharing(item);
    const encodedMessage = encodeURIComponent(message);
    
    const phoneNumber = this.phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }
}
