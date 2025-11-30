import { randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { existsSync } from "fs";
import type { Product, Order, OrderItem, InsertOrder } from "@shared/schema";

// Helper function to get current time in Indian Standard Time (IST/UTC+5:30)
function getISTTimestamp(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString();
}

// Product catalog - ACP-inspired commerce layer with diverse pricing
const PRODUCTS: Product[] = [
  {
    id: "mug-001",
    name: "Stoneware Coffee Mug",
    description: "Elegant handcrafted ceramic mug with a smooth matte finish. Perfect for your morning coffee.",
    price: 450,
    currency: "INR",
    category: "mug",
    color: "white",
    inStock: true,
    image: "white_ceramic_coffee_mug.png",
  },
  {
    id: "mug-002",
    name: "Premium Ceramic Mug",
    description: "Sophisticated charcoal color with glossy finish. Durable and long-lasting.",
    price: 550,
    currency: "INR",
    category: "mug",
    color: "charcoal",
    inStock: true,
    image: "charcoal_gray_t-shirt.png",
  },
  {
    id: "mug-003",
    name: "Ceramic Tea Cup Set",
    description: "Set of 4 delicate tea cups with traditional patterns. Perfect for tea lovers.",
    price: 1200,
    currency: "INR",
    category: "mug",
    color: "gray",
    inStock: true,
    image: "gray_ceramic_tea_set.png",
  },
  {
    id: "mug-004",
    name: "Luxury Porcelain Mug",
    description: "Premium porcelain with hand-painted designs. Limited edition.",
    price: 1800,
    currency: "INR",
    category: "mug",
    color: "white",
    inStock: true,
    image: "white_ceramic_coffee_mug.png",
  },
  {
    id: "hoodie-001-s",
    name: "Premium Cotton Hoodie",
    description: "Ultra-soft cotton blend hoodie with kangaroo pocket. Relaxed fit for everyday comfort.",
    price: 1999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "S",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "hoodie-001-m",
    name: "Premium Cotton Hoodie",
    description: "Ultra-soft cotton blend hoodie with kangaroo pocket. Relaxed fit for everyday comfort.",
    price: 1999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "M",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "hoodie-001-l",
    name: "Premium Cotton Hoodie",
    description: "Ultra-soft cotton blend hoodie with kangaroo pocket. Relaxed fit for everyday comfort.",
    price: 1999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "L",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "hoodie-002-s",
    name: "Standard Cotton Hoodie",
    description: "Comfortable cotton hoodie in classic gray tone. Great value for money.",
    price: 1799,
    currency: "INR",
    category: "hoodie",
    color: "charcoal",
    size: "S",
    inStock: true,
    image: "charcoal_cotton_hoodie.png",
  },
  {
    id: "hoodie-002-m",
    name: "Standard Cotton Hoodie",
    description: "Comfortable cotton hoodie in classic gray tone. Great value for money.",
    price: 1799,
    currency: "INR",
    category: "hoodie",
    color: "charcoal",
    size: "M",
    inStock: true,
    image: "charcoal_cotton_hoodie.png",
  },
  {
    id: "hoodie-002-l",
    name: "Standard Cotton Hoodie",
    description: "Comfortable cotton hoodie in classic gray tone. Great value for money.",
    price: 1799,
    currency: "INR",
    category: "hoodie",
    color: "charcoal",
    size: "L",
    inStock: true,
    image: "charcoal_cotton_hoodie.png",
  },
  {
    id: "hoodie-003-s",
    name: "Tech Zip-Up Hoodie",
    description: "Moisture-wicking fabric with hidden pockets. Perfect for workouts and sports.",
    price: 2899,
    currency: "INR",
    category: "hoodie",
    color: "navy",
    size: "S",
    inStock: true,
    image: "navy_tech_zip_hoodie.png",
  },
  {
    id: "hoodie-003-m",
    name: "Tech Zip-Up Hoodie",
    description: "Moisture-wicking fabric with hidden pockets. Perfect for workouts and sports.",
    price: 2899,
    currency: "INR",
    category: "hoodie",
    color: "navy",
    size: "M",
    inStock: true,
    image: "navy_tech_zip_hoodie.png",
  },
  {
    id: "hoodie-003-l",
    name: "Tech Zip-Up Hoodie",
    description: "Moisture-wicking fabric with hidden pockets. Perfect for workouts and sports.",
    price: 2899,
    currency: "INR",
    category: "hoodie",
    color: "navy",
    size: "L",
    inStock: true,
    image: "navy_tech_zip_hoodie.png",
  },
  {
    id: "hoodie-004-s",
    name: "Luxury Wool Blend Hoodie",
    description: "Premium wool blend with thermal lining. Ultra-warm and sophisticated.",
    price: 3999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "S",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "hoodie-004-m",
    name: "Luxury Wool Blend Hoodie",
    description: "Premium wool blend with thermal lining. Ultra-warm and sophisticated.",
    price: 3999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "M",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "hoodie-004-l",
    name: "Luxury Wool Blend Hoodie",
    description: "Premium wool blend with thermal lining. Ultra-warm and sophisticated.",
    price: 3999,
    currency: "INR",
    category: "hoodie",
    color: "black",
    size: "L",
    inStock: true,
    image: "black_premium_hoodie.png",
  },
  {
    id: "tshirt-001-s",
    name: "Budget Cotton T-Shirt",
    description: "100% organic cotton t-shirt. Breathable and comfortable for everyday wear.",
    price: 399,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "S",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "tshirt-001-m",
    name: "Budget Cotton T-Shirt",
    description: "100% organic cotton t-shirt. Breathable and comfortable for everyday wear.",
    price: 399,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "M",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "tshirt-001-l",
    name: "Budget Cotton T-Shirt",
    description: "100% organic cotton t-shirt. Breathable and comfortable for everyday wear.",
    price: 399,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "L",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "tshirt-002-s",
    name: "Classic Cotton T-Shirt",
    description: "Premium quality cotton t-shirt in elegant black. Perfect fit.",
    price: 549,
    currency: "INR",
    category: "tshirt",
    color: "black",
    size: "S",
    inStock: true,
    image: "charcoal_gray_t-shirt.png",
  },
  {
    id: "tshirt-002-m",
    name: "Classic Cotton T-Shirt",
    description: "Premium quality cotton t-shirt in elegant black. Perfect fit.",
    price: 549,
    currency: "INR",
    category: "tshirt",
    color: "black",
    size: "M",
    inStock: true,
    image: "charcoal_gray_t-shirt.png",
  },
  {
    id: "tshirt-002-l",
    name: "Classic Cotton T-Shirt",
    description: "Premium quality cotton t-shirt in elegant black. Perfect fit.",
    price: 549,
    currency: "INR",
    category: "tshirt",
    color: "black",
    size: "L",
    inStock: true,
    image: "charcoal_gray_t-shirt.png",
  },
  {
    id: "tshirt-003-s",
    name: "Graphic Print T-Shirt",
    description: "Bold graphic print t-shirt with modern artistic design. Limited edition.",
    price: 899,
    currency: "INR",
    category: "tshirt",
    color: "gray",
    size: "S",
    inStock: true,
    image: "gray_ceramic_tea_set.png",
  },
  {
    id: "tshirt-003-m",
    name: "Graphic Print T-Shirt",
    description: "Bold graphic print t-shirt with modern artistic design. Limited edition.",
    price: 899,
    currency: "INR",
    category: "tshirt",
    color: "gray",
    size: "M",
    inStock: true,
    image: "gray_ceramic_tea_set.png",
  },
  {
    id: "tshirt-003-l",
    name: "Graphic Print T-Shirt",
    description: "Bold graphic print t-shirt with modern artistic design. Limited edition.",
    price: 899,
    currency: "INR",
    category: "tshirt",
    color: "gray",
    size: "L",
    inStock: true,
    image: "gray_ceramic_tea_set.png",
  },
  {
    id: "tshirt-004-s",
    name: "Premium Designer T-Shirt",
    description: "High-end designer tee with exclusive print. For fashion enthusiasts.",
    price: 1499,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "S",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "tshirt-004-m",
    name: "Premium Designer T-Shirt",
    description: "High-end designer tee with exclusive print. For fashion enthusiasts.",
    price: 1499,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "M",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "tshirt-004-l",
    name: "Premium Designer T-Shirt",
    description: "High-end designer tee with exclusive print. For fashion enthusiasts.",
    price: 1499,
    currency: "INR",
    category: "tshirt",
    color: "white",
    size: "L",
    inStock: true,
    image: "white_cotton_t-shirt.png",
  },
  {
    id: "bottle-001",
    name: "Standard Water Bottle",
    description: "Basic water bottle with leak-proof design. Perfect for daily use.",
    price: 399,
    currency: "INR",
    category: "bottle",
    color: "silver",
    inStock: true,
    image: "silver_water_bottle.png",
  },
  {
    id: "bottle-002",
    name: "Premium Insulated Bottle",
    description: "Double-wall vacuum insulated. Keeps drinks cold for 24 hours or hot for 12 hours.",
    price: 999,
    currency: "INR",
    category: "bottle",
    color: "black",
    inStock: true,
    image: "black_insulated_water_bottle.png",
  },
  {
    id: "bottle-003",
    name: "Luxury Insulated Bottle",
    description: "Premium stainless steel with advanced insulation technology. Eco-friendly.",
    price: 1599,
    currency: "INR",
    category: "bottle",
    color: "silver",
    inStock: true,
    image: "silver_water_bottle.png",
  },
  {
    id: "bottle-004",
    name: "Smart Temperature Bottle",
    description: "LED temperature display bottle. Keep track of drink temperature.",
    price: 2299,
    currency: "INR",
    category: "bottle",
    color: "black",
    inStock: true,
    image: "black_insulated_water_bottle.png",
  },
  {
    id: "bag-001",
    name: "Basic Canvas Tote",
    description: "Lightweight canvas tote. Perfect for shopping and daily use.",
    price: 299,
    currency: "INR",
    category: "bag",
    color: "natural",
    inStock: true,
    image: "natural_canvas_tote_bag.png",
  },
  {
    id: "bag-002",
    name: "Durable Canvas Tote Bag",
    description: "Spacious canvas tote with reinforced handles. Extra durable construction.",
    price: 599,
    currency: "INR",
    category: "bag",
    color: "natural",
    inStock: true,
    image: "natural_canvas_tote_bag.png",
  },
  {
    id: "bag-003",
    name: "Premium Leather Tote",
    description: "Genuine leather tote with sophisticated design. Timeless classic.",
    price: 2499,
    currency: "INR",
    category: "bag",
    color: "black",
    inStock: true,
    image: "natural_canvas_tote_bag.png",
  },
  {
    id: "bag-004",
    name: "Designer Luxury Tote",
    description: "Limited edition designer tote with premium materials. Statement piece.",
    price: 4999,
    currency: "INR",
    category: "bag",
    color: "natural",
    inStock: true,
    image: "natural_canvas_tote_bag.png",
  },
];

// In-memory order storage with persistence to orders.json
let ORDERS: Order[] = [];

const ORDERS_FILE = "./orders.json";

function loadOrders(): void {
  if (existsSync(ORDERS_FILE)) {
    try {
      const data = readFileSync(ORDERS_FILE, "utf-8");
      ORDERS = JSON.parse(data);
    } catch (error) {
      console.error("Failed to load orders.json:", error);
      ORDERS = [];
    }
  }
}

function saveOrders(): void {
  try {
    writeFileSync(ORDERS_FILE, JSON.stringify(ORDERS, null, 2));
  } catch (error) {
    console.error("Failed to save orders.json:", error);
  }
}

// Load orders on startup
loadOrders();

export interface IStorage {
  // Product operations
  listProducts(filters?: {
    category?: string;
    maxPrice?: number;
    color?: string;
    search?: string;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  
  // Order operations
  createOrder(items: Array<{ productId: string; quantity: number }>): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getLastOrder(): Promise<Order | undefined>;
  listOrders(): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  async listProducts(filters?: {
    category?: string;
    maxPrice?: number;
    color?: string;
    search?: string;
  }): Promise<Product[]> {
    let result = [...PRODUCTS];
    
    if (filters?.category) {
      result = result.filter(p => 
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters?.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters?.color) {
      result = result.filter(p => 
        p.color?.toLowerCase().includes(filters.color!.toLowerCase())
      );
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }
  
  async getProduct(id: string): Promise<Product | undefined> {
    return PRODUCTS.find(p => p.id === id);
  }
  
  async createOrder(items: Array<{ productId: string; quantity: number }>, customerInfo?: { customerName?: string; customerAddress?: string; estimatedDelivery?: string }): Promise<Order> {
    const orderItems: OrderItem[] = [];
    let total = 0;
    let currency = "INR";
    
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        currency: product.currency,
      });
      
      total += product.price * item.quantity;
      currency = product.currency;
    }
    
    const order: Order = {
      id: `ORD-${randomUUID().split('-')[0].toUpperCase()}`,
      items: orderItems,
      total,
      currency,
      createdAt: getISTTimestamp(),
      customerName: customerInfo?.customerName,
      customerAddress: customerInfo?.customerAddress,
      estimatedDelivery: customerInfo?.estimatedDelivery,
    };
    
    ORDERS.push(order);
    saveOrders();
    return order;
  }
  
  async getOrder(id: string): Promise<Order | undefined> {
    return ORDERS.find(o => o.id === id);
  }
  
  async getLastOrder(): Promise<Order | undefined> {
    return ORDERS.length > 0 ? ORDERS[ORDERS.length - 1] : undefined;
  }
  
  async listOrders(): Promise<Order[]> {
    return [...ORDERS];
  }
}

export const storage = new MemStorage();
