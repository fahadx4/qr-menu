import { mockTenant, mockSettings } from "@/mock/tenant";
import { mockCategories, mockItems } from "@/mock/menu";
import {
  TemplateModern,
  TemplateClassic,
  TemplateBold,
  TemplateMinimal,
  TemplatePhoto,
  TemplateBistro,
} from "@/components/public/templates";
import type { WebsiteTemplate } from "@/mock/tenant";

type TemplateComponent = React.ComponentType<TemplateProps>;

interface TemplateProps {
  restaurant: {
    name: string;
    description: string;
    logo?: string;
    cover_image?: string;
    cuisine: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    hours: { day: string; open: string; close: string; closed: boolean }[];
    social?: { instagram?: string; facebook?: string };
  };
  featuredItems: { id: string; name: string; description: string; price: number; image_url?: string; tags?: string[] }[];
  categories: { id: string; name: string }[];
  isOpen: boolean;
  orderingEnabled: boolean;
  reservationsEnabled: boolean;
  slug: string;
}

const TEMPLATE_MAP: Record<WebsiteTemplate, TemplateComponent> = {
  modern: TemplateModern,
  classic: TemplateClassic,
  bold: TemplateBold,
  minimal: TemplateMinimal,
  photo: TemplatePhoto,
  bistro: TemplateBistro,
};

const DEFAULT_HOURS = [
  { day: "Monday",    open: "11:00 AM", close: "10:00 PM", closed: false },
  { day: "Tuesday",   open: "11:00 AM", close: "10:00 PM", closed: false },
  { day: "Wednesday", open: "11:00 AM", close: "10:00 PM", closed: false },
  { day: "Thursday",  open: "11:00 AM", close: "10:00 PM", closed: false },
  { day: "Friday",    open: "11:00 AM", close: "11:00 PM", closed: false },
  { day: "Saturday",  open: "12:00 PM", close: "11:00 PM", closed: false },
  { day: "Sunday",    open: "12:00 PM", close: "9:00 PM",  closed: false },
];

export default async function RestaurantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const SelectedTemplate =
    TEMPLATE_MAP[mockTenant.website_template as WebsiteTemplate] ?? TemplateModern;

  const templateProps: TemplateProps = {
    restaurant: {
      name: mockTenant.name,
      description: mockTenant.description ?? "A place where flavours meet memories.",
      logo: mockTenant.logo_url,
      cover_image: mockTenant.cover_url,
      cuisine: "American · Burgers",
      phone: "+1 212 555 0100",
      email: "hello@burgerhouse.com",
      address: "123 Main Street, New York, NY 10001",
      city: "New York",
      hours: DEFAULT_HOURS,
      social: {
        instagram: "burgerhouse",
        facebook: "burgerhouse",
      },
    },
    featuredItems: mockItems.slice(0, 6).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      image_url: item.image_urls?.[0],
      tags: item.tags,
    })),
    categories: mockCategories.map((cat) => ({ id: cat.id, name: cat.name })),
    isOpen: true,
    orderingEnabled: mockSettings.ordering_dine_in || mockSettings.ordering_takeaway || mockSettings.ordering_delivery,
    reservationsEnabled: true,
    slug,
  };

  return <SelectedTemplate {...templateProps} />;
}
