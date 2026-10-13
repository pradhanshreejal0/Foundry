import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const seedTestData = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Test Seeding...");

    // 1. Create Super Admin
    const adminEmail = "superadmin@foundry.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: "AdminPassword123!",
        role: "admin",
      });
      console.log(`Created Super Admin: ${adminEmail} / AdminPassword123!`);
    } else {
      console.log(`Super Admin already exists: ${adminEmail}`);
    }

    // 2. Create Test Vendor User & Vendor Store
    const vendorEmail = "vendor@foundry.com";
    let vendorUser = await User.findOne({ email: vendorEmail });
    if (!vendorUser) {
      vendorUser = await User.create({
        name: "Aura Artisan",
        email: vendorEmail,
        password: "VendorPassword123!",
        role: "vendor",
      });
      console.log(`Created Vendor User: ${vendorEmail} / VendorPassword123!`);
    } else {
      console.log(`Vendor User already exists: ${vendorEmail}`);
    }

    let vendorStore = await Vendor.findOne({ user: vendorUser._id });
    if (!vendorStore) {
      vendorStore = await Vendor.create({
        user: vendorUser._id,
        storeName: "Aura Luxury Goods",
        storeSlug: "aura-luxury-goods",
        slug: "aura-luxury-goods",
        storeDescription: "Curated heirloom-quality lifestyle goods and refined accessories.",
        status: "approved",
        contactEmail: vendorEmail,
        phone: "+1555019283",
      });
      console.log("Created Vendor Store: Aura Luxury Goods (storeSlug: aura-luxury-goods)");
    } else {
      console.log("Vendor Store already exists.");
    }

    // 3. Create Test Customer Client
    const customerEmail = "customer@foundry.com";
    let customerUser = await User.findOne({ email: customerEmail });
    if (!customerUser) {
      customerUser = await User.create({
        name: "Julian Sterling",
        email: customerEmail,
        password: "CustomerPassword123!",
        role: "customer",
      });
      console.log(`Created Test Customer: ${customerEmail} / CustomerPassword123!`);
    } else {
      console.log(`Test Customer already exists: ${customerEmail}`);
    }

    // 4. Create Categories
    const categoriesData = [
      {
        name: "Horology & Watches",
        slug: "horology-watches",
        description: "Exquisite timepieces crafted for precision and timeless elegance.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      },
      {
        name: "Fine Leather Goods",
        slug: "fine-leather-goods",
        description: "Handcrafted Italian leather briefcases, wallets, and bags.",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
      },
      {
        name: "Acoustic & Audio",
        slug: "acoustic-audio",
        description: "High-fidelity sound systems and artisanal headphones.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      },
      {
        name: "Architectural Decor",
        slug: "architectural-decor",
        description: "Minimalist sculptures, lighting, and statement home objects.",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800",
      },
    ];

    const savedCategories = {};
    for (const cat of categoriesData) {
      let category = await Category.findOne({ slug: cat.slug });
      if (!category) {
        category = await Category.create({
          ...cat,
          createdBy: admin._id,
        });
        console.log(`Created Category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
      savedCategories[cat.slug] = category._id;
    }

    // 5. Create Products (matching Product schema: title, price, stock, images array of strings)
    const productsData = [
      {
        title: "Chronometer 01 - Brushed Titanium",
        slug: "chronometer-01-brushed-titanium",
        description: "An exceptional automatic timepiece featuring a lightweight brushed titanium case, sapphire crystal glass, and genuine alligator leather strap. Water resistant to 100 meters.",
        price: 1850,
        compareAtPrice: 2200,
        stock: 15,
        category: savedCategories["horology-watches"],
        vendor: vendorStore._id,
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900"
        ],
      },
      {
        title: "The Executive Tuscan Briefcase",
        slug: "the-executive-tuscan-briefcase",
        description: "Hand-stitched in Florence from full-grain vegetable-tanned Tuscan leather. Features brass hardware, custom suede lining, and a dedicated compartment for 16-inch laptops.",
        price: 980,
        compareAtPrice: 1200,
        stock: 8,
        category: savedCategories["fine-leather-goods"],
        vendor: vendorStore._id,
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900"
        ],
      },
      {
        title: "Aura Master Acoustic Headphones",
        slug: "aura-master-acoustic-headphones",
        description: "Studio-grade planar magnetic drivers encased in anodized aluminum and walnut earcups. Delivers pristine acoustic clarity and active noise cancellation.",
        price: 650,
        compareAtPrice: 750,
        stock: 20,
        category: savedCategories["acoustic-audio"],
        vendor: vendorStore._id,
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=900"
        ],
      },
      {
        title: "Minimalist Brass Orbit Lamp",
        slug: "minimalist-brass-orbit-lamp",
        description: "Sculptural table lamp crafted from solid unlacquered brass and hand-blown opal glass. Emits a warm, dimmable ambient glow.",
        price: 340,
        compareAtPrice: 400,
        stock: 12,
        category: savedCategories["architectural-decor"],
        vendor: vendorStore._id,
        featured: false,
        images: [
          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900",
          "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900"
        ],
      },
    ];

    for (const prod of productsData) {
      const existingProd = await Product.findOne({ slug: prod.slug });
      if (!existingProd) {
        await Product.create(prod);
        console.log(`Created Product: ${prod.title}`);
      } else {
        console.log(`Product already exists: ${prod.title}`);
      }
    }

    console.log("\n==============================================");
    console.log("✅ Test Data Seeding Completed Successfully!");
    console.log("----------------------------------------------");
    console.log("Super Admin Login : superadmin@foundry.com / AdminPassword123!");
    console.log("Vendor User Login : vendor@foundry.com / VendorPassword123!");
    console.log("Customer Client   : customer@foundry.com / CustomerPassword123!");
    console.log("==============================================");
    process.exit(0);
  } catch (error) {
    console.error("Test data seeding failed:", error);
    process.exit(1);
  }
};

seedTestData();
