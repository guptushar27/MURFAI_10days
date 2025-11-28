import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export interface Product {
  id: string;
  name: string;
  category: 'groceries' | 'snacks' | 'prepared' | 'beverages';
  price: number;
  unit: string;
  tags: string[];
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered';
  timestamp: number;
}

// --- Catalog Data (JSON) - INDIAN PRODUCTS & PRICES (INR) ---

export const CATALOG: Product[] = [
  // Groceries (Staples & Dairy)
  { id: 'g1', name: 'Amul Taaza Milk', category: 'groceries', price: 27, unit: '500ml', tags: ['dairy', 'fresh', 'chai'] },
  { id: 'g2', name: 'Britannia Brown Bread', category: 'groceries', price: 45, unit: 'loaf', tags: ['breakfast', 'healthy', 'sandwich'] },
  { id: 'g3', name: 'Farm Fresh Eggs', category: 'groceries', price: 84, unit: 'dozen', tags: ['protein', 'breakfast'] },
  { id: 'g4', name: 'Amul Butter', category: 'groceries', price: 56, unit: '100g', tags: ['dairy', 'spread', 'butter-naan'] },
  { id: 'g5', name: 'Aashirvaad Atta', category: 'groceries', price: 230, unit: '5kg', tags: ['flour', 'staple', 'naan'] },
  { id: 'g6', name: 'Tata Salt', category: 'groceries', price: 28, unit: '1kg', tags: ['staple', 'spices'] },
  { id: 'g7', name: 'India Gate Basmati Rice', category: 'groceries', price: 140, unit: '1kg', tags: ['rice', 'dinner'] },
  { id: 'g8', name: 'Tata Sampann Toor Dal', category: 'groceries', price: 165, unit: '1kg', tags: ['pulses', 'protein', 'dal'] },
  { id: 'g9', name: 'Amul Malai Paneer', category: 'groceries', price: 95, unit: '200g', tags: ['dairy', 'veg', 'paneer'] },
  { id: 'g10', name: 'Kissan Mixed Fruit Jam', category: 'groceries', price: 140, unit: '500g', tags: ['sweet', 'breakfast', 'sandwich'] },
  { id: 'g11', name: 'Red Label Tea', category: 'groceries', price: 130, unit: '250g', tags: ['beverage', 'chai'] },
  { id: 'g12', name: 'Fortune Mustard Oil', category: 'groceries', price: 160, unit: '1L', tags: ['oil', 'cooking'] },
  { id: 'g13', name: 'Onion', category: 'groceries', price: 35, unit: '1kg', tags: ['vegetable', 'paneer'] },
  { id: 'g14', name: 'Potato', category: 'groceries', price: 40, unit: '1kg', tags: ['vegetable'] },
  { id: 'g15', name: 'Peanut Butter', category: 'groceries', price: 120, unit: '250g', tags: ['spread', 'sandwich'] },
  { id: 'g16', name: 'Tomato', category: 'groceries', price: 30, unit: '1kg', tags: ['vegetable', 'paneer'] },
  { id: 'g17', name: 'Ginger Garlic Paste', category: 'groceries', price: 45, unit: '300g', tags: ['spice', 'paneer'] },
  { id: 'g18', name: 'Jeera', category: 'groceries', price: 180, unit: '100g', tags: ['spice', 'dal'] },
  
  // Snacks
  { id: 's1', name: 'Maggi 2-Minute Noodles', category: 'snacks', price: 14, unit: 'pack', tags: ['instant', 'noodles'] },
  { id: 's2', name: 'Lays Magic Masala', category: 'snacks', price: 20, unit: 'pack', tags: ['chips', 'spicy'] },
  { id: 's3', name: 'Haldiram Aloo Bhujia', category: 'snacks', price: 55, unit: 'pack', tags: ['namkeen', 'crunchy'] },
  { id: 's4', name: 'Cadbury Dairy Milk', category: 'snacks', price: 40, unit: 'bar', tags: ['chocolate', 'sweet'] },
  { id: 's5', name: 'Parle-G Biscuits', category: 'snacks', price: 10, unit: 'pack', tags: ['biscuits', 'tea-time', 'chai'] },

  // Prepared Food
  { id: 'p1', name: 'Vegetable Biryani', category: 'prepared', price: 250, unit: 'plate', tags: ['dinner', 'rice', 'vegetarian'] },
  { id: 'p2', name: 'Paneer Butter Masala', category: 'prepared', price: 280, unit: 'portion', tags: ['curry', 'dinner', 'paneer', 'vegetarian'] },
  { id: 'p3', name: 'Samosa', category: 'prepared', price: 20, unit: 'piece', tags: ['snack', 'hot', 'vegetarian'] },
  { id: 'p4', name: 'Masala Dosa', category: 'prepared', price: 120, unit: 'plate', tags: ['breakfast', 'south-indian', 'vegetarian'] },
  { id: 'p5', name: 'Butter Naan', category: 'prepared', price: 30, unit: 'piece', tags: ['bread', 'naan', 'vegetarian'] },
  { id: 'p6', name: 'Pani Puri', category: 'prepared', price: 40, unit: 'plate', tags: ['snack', 'street-food', 'vegetarian'] },
  { id: 'p7', name: 'Chole Bhature', category: 'prepared', price: 180, unit: 'portion', tags: ['lunch', 'vegetarian'] },
  { id: 'p8', name: 'Aloo Paratha', category: 'prepared', price: 60, unit: 'piece', tags: ['breakfast', 'vegetarian'] },

  // Beverages
  { id: 'b1', name: 'Thums Up', category: 'beverages', price: 40, unit: '750ml', tags: ['cold-drink', 'soda'] },
  { id: 'b2', name: 'Real Mango Juice', category: 'beverages', price: 110, unit: '1L', tags: ['juice', 'fruit'] },
  { id: 'b3', name: 'Amul Lassi', category: 'beverages', price: 25, unit: 'pack', tags: ['dairy', 'cool', 'yogurt'] },
];

// --- Recipe Mapping (Indian Vegetarian Dishes) ---

export const RECIPES: Record<string, string[]> = {
  'chai': ['Amul Taaza Milk', 'Red Label Tea', 'Parle-G Biscuits'],
  'tea': ['Amul Taaza Milk', 'Red Label Tea', 'Parle-G Biscuits'],
  'peanut butter sandwich': ['Britannia Brown Bread', 'Peanut Butter', 'Kissan Mixed Fruit Jam'],
  'peanut butter': ['Britannia Brown Bread', 'Peanut Butter'],
  'sandwich': ['Britannia Brown Bread', 'Amul Butter', 'Kissan Mixed Fruit Jam'],
  'butter naan': ['Aashirvaad Atta', 'Amul Butter', 'Amul Taaza Milk', 'Tata Salt'],
  'naan': ['Aashirvaad Atta', 'Amul Butter', 'Amul Taaza Milk', 'Tata Salt'],
  'dal chawal': ['Tata Sampann Toor Dal', 'India Gate Basmati Rice', 'Fortune Mustard Oil', 'Jeera'],
  'dal rice': ['Tata Sampann Toor Dal', 'India Gate Basmati Rice', 'Fortune Mustard Oil', 'Jeera'],
  'paneer butter masala': ['Amul Malai Paneer', 'Amul Butter', 'Tomato', 'Onion', 'Ginger Garlic Paste'],
  'paneer': ['Amul Malai Paneer', 'Onion', 'Tomato'],
  'rice': ['India Gate Basmati Rice'],
  'maggi': ['Maggi 2-Minute Noodles'],
  'breakfast': ['Britannia Brown Bread', 'Amul Butter', 'Farm Fresh Eggs', 'Amul Taaza Milk'],
  'dinner': ['Aashirvaad Atta', 'Amul Malai Paneer', 'Tata Salt', 'Onion', 'Tomato'],
  'party': ['Thums Up', 'Lays Magic Masala', 'Haldiram Aloo Bhujia', 'Samosa'],
  'samosa': ['Samosa'],
  'dosa': ['Masala Dosa'],
  'biryani': ['Vegetable Biryani'],
  'chole bhature': ['Chole Bhature'],
  'aloo paratha': ['Aloo Paratha'],
};

// --- Store (Mock Database) ---

interface StoreState {
  cart: CartItem[];
  orders: Order[];
  addToCart: (productName: string, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productName: string) => { success: boolean; message: string };
  clearCart: () => void;
  placeOrder: () => { success: boolean; message: string; order?: Order };
  getOrderStatus: (orderId?: string) => string;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      orders: [],

      addToCart: (productName, quantity = 1) => {
        const searchTerm = productName.toLowerCase().trim();
        
        // Exact match first
        let product = CATALOG.find(p => p.name.toLowerCase() === searchTerm);
        
        // Fuzzy search - product name includes search term
        if (!product) {
          product = CATALOG.find(p => p.name.toLowerCase().includes(searchTerm));
        }
        
        // Reverse fuzzy search - search term includes product name parts
        if (!product) {
          product = CATALOG.find(p => {
            const nameParts = p.name.toLowerCase().split(' ');
            return nameParts.some(part => part.includes(searchTerm));
          });
        }

        // Try finding by tag
        if (!product) {
          product = CATALOG.find(p => 
            p.tags.some(t => t.toLowerCase().includes(searchTerm))
          );
        }
        
        if (!product) {
          return { success: false, message: `I couldn't find ${productName} in our store. Try 'add milk', 'buy maggi', or 'ingredients for chai'.` };
        }

        set((state) => {
          const existingItem = state.cart.find(item => item.id === product.id);
          if (existingItem) {
            return {
              cart: state.cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
              )
            };
          }
          return { cart: [...state.cart, { ...product, quantity }] };
        });

        return { success: true, message: `Added ${product.name} to your cart.` };
      },

      removeFromCart: (productName) => {
        set((state) => ({
          cart: state.cart.filter(item => !item.name.toLowerCase().includes(productName.toLowerCase()))
        }));
        return { success: true, message: `Removed ${productName} from your cart.` };
      },

      clearCart: () => set({ cart: [] }),

      placeOrder: () => {
        const { cart, orders } = get();
        if (cart.length === 0) {
          return { success: false, message: "Your cart is empty." };
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newOrder: Order = {
          id: Math.random().toString(36).substring(7).toUpperCase(),
          items: [...cart],
          total,
          status: 'placed',
          timestamp: Date.now(),
        };

        set({ orders: [newOrder, ...orders], cart: [] });
        
        // Simulate "saving to JSON file"
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(newOrder, null, 2)], {type: 'application/json'});
        element.href = URL.createObjectURL(file);
        element.download = `Order_${newOrder.id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        return { success: true, message: `Order placed successfully! Total is ₹${total.toFixed(2)}. I've downloaded your receipt.` };
      },

      getOrderStatus: (orderId) => {
        const { orders } = get();
        const order = orderId ? orders.find(o => o.id === orderId) : orders[0];
        
        if (!order) return "You haven't placed any orders yet.";
        return `Order #${order.id} is currently ${order.status}. It will be delivered by our delivery partner soon.`;
      }
    }),
    {
      name: 'indian-grocery-store-storage',
    }
  )
);
