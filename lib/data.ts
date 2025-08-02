import { slugify } from "./utils"

export type Item = {
  id: string
  name: string
  slug: string
  collectionSlug: string
  description: string
  price: number
  image: string
}

export type Collection = {
  id: string
  name: string
  slug: string
  description: string
  image: string
}

export const collections: Collection[] = [
  {
    id: "1",
    name: "Colección Primavera-Verano 2025",
    slug: slugify("Colección Primavera-Verano 2025"),
    description: "Frescura y ligereza para los días soleados.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "2",
    name: "Colección Otoño-Invierno 2024",
    slug: slugify("Colección Otoño-Invierno 2024"),
    description: "Elegancia y calidez para las noches frías.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "3",
    name: "Colección Esencial",
    slug: slugify("Colección Esencial"),
    description: "Básicos atemporales que no pueden faltar en tu armario.",
    image: "/placeholder.svg?height=400&width=600",
  },
]

export const items: Item[] = [
  {
    id: "p1",
    name: "Vestido de Seda 'Amanecer'",
    slug: slugify("Vestido de Seda 'Amanecer'"),
    collectionSlug: slugify("Colección Primavera-Verano 2025"),
    description: "Un vestido fluido de seda, perfecto para el día a día o una ocasión especial.",
    price: 250.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p2",
    name: "Camisa Lino 'Brisa Marina'",
    slug: slugify("Camisa Lino 'Brisa Marina'"),
    collectionSlug: slugify("Colección Primavera-Verano 2025"),
    description: "Camisa de lino transpirable, ideal para climas cálidos.",
    price: 95.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p3",
    name: "Abrigo de Lana 'Noche Estrellada'",
    slug: slugify("Abrigo de Lana 'Noche Estrellada'"),
    collectionSlug: slugify("Colección Otoño-Invierno 2024"),
    description: "Abrigo de lana virgen con corte clásico, para un estilo sofisticado.",
    price: 480.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p4",
    name: "Jersey Cachemira 'Confort'",
    slug: slugify("Jersey Cachemira 'Confort'"),
    collectionSlug: slugify("Colección Otoño-Invierno 2024"),
    description: "Jersey de cachemira suave y cálido, un básico de lujo.",
    price: 320.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p5",
    name: "Pantalón Sastre 'Versátil'",
    slug: slugify("Pantalón Sastre 'Versátil'"),
    collectionSlug: slugify("Colección Esencial"),
    description: "Pantalón de corte sastre, adaptable a cualquier look.",
    price: 150.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p6",
    name: "Camiseta Algodón 'Puro'",
    slug: slugify("Camiseta Algodón 'Puro'"),
    collectionSlug: slugify("Colección Esencial"),
    description: "Camiseta de algodón orgánico, suave y duradera.",
    price: 60.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p7",
    name: "Zapatillas Urbanas 'Vanguardia'",
    slug: slugify("Zapatillas Urbanas 'Vanguardia'"),
    collectionSlug: slugify("Colección Esencial"),
    description: "Zapatillas de diseño moderno para el día a día.",
    price: 120.0,
    image: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "p8",
    name: "Chaqueta Denim 'Rebelde'",
    slug: slugify("Chaqueta Denim 'Rebelde'"),
    collectionSlug: slugify("Colección Esencial"),
    description: "Chaqueta vaquera clásica con un toque moderno.",
    price: 180.0,
    image: "/placeholder.svg?height=400&width=300",
  },
]

// Alias for backward compatibility
export const products = items;
