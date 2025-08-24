import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { 
  Users, 
  Target, 
  Award, 
  Heart, 
  CheckCircle, 
  Star,
  Building,
  Globe,
  Clock,
  Shield
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Custom School Stationary & Uniforms",
  description: "Learn about our mission to provide premium quality customizable school stationary, uniforms, and educational products. Discover our story, values, and commitment to excellence.",
  keywords: "about us, school stationary company, custom uniforms, educational products, company story",
  openGraph: {
    title: "About Us | Custom School Stationary & Uniforms",
    description: "Learn about our mission to provide premium quality customizable school stationary, uniforms, and educational products.",
    type: "website",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "About Us" }
];

const stats = [
  { icon: Users, label: "Happy Customers", value: "10,000+" },
  { icon: Building, label: "Schools Served", value: "500+" },
  { icon: Globe, label: "Cities Covered", value: "50+" },
  { icon: Clock, label: "Years Experience", value: "15+" }
];

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To provide high-quality, customizable educational products that enhance learning experiences and foster school pride."
  },
  {
    icon: Heart,
    title: "Our Vision",
    description: "To be the leading provider of educational supplies, empowering schools and students with premium, personalized products."
  },
  {
    icon: Award,
    title: "Our Values",
    description: "Quality, innovation, customer satisfaction, and commitment to educational excellence drive everything we do."
  }
];

const features = [
  {
    icon: CheckCircle,
    title: "Premium Quality",
    description: "We use only the finest materials and employ rigorous quality control processes to ensure every product meets our high standards."
  },
  {
    icon: Star,
    title: "Custom Solutions",
    description: "Our advanced customization options allow schools to create unique products that reflect their identity and values."
  },
  {
    icon: Shield,
    title: "Reliable Service",
    description: "With fast delivery, excellent customer support, and consistent quality, we're the trusted partner for educational institutions."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-blue-600">Office Shop</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              For over 15 years, we've been dedicated to providing premium quality school stationary, 
              uniforms, and educational products that inspire learning and foster school pride.
            </p>
            <div className="w-24 h-1 bg-orange-500 mx-auto mt-8"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Foundation</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built on strong principles and driven by a passion for educational excellence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <value.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2009, Office Shop began as a small family business with a simple mission: 
                  to provide schools with high-quality, affordable educational supplies that would enhance 
                  the learning experience for students across the country.
                </p>
                <p>
                  What started as a local supplier has grown into a trusted partner for over 500 schools 
                  and educational institutions. Our commitment to quality, innovation, and customer service 
                  has remained unchanged throughout our journey.
                </p>
                <p>
                  Today, we're proud to offer a comprehensive range of customizable products, from school 
                  uniforms and stationary to specialized educational materials, all designed to meet the 
                  unique needs of modern educational institutions.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">2009 - Founded</h4>
                    <p className="text-gray-600 text-sm">Started as a local school supply business</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">2015 - Expansion</h4>
                    <p className="text-gray-600 text-sm">Introduced custom uniform services</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">2020 - Digital</h4>
                    <p className="text-gray-600 text-sm">Launched online platform and design tools</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">2024 - Today</h4>
                    <p className="text-gray-600 text-sm">Serving 500+ schools nationwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Office Shop?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're more than just a supplier - we're your partner in educational excellence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of schools that trust Office Shop for their educational supply needs. 
            Let's create something amazing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Get In Touch
            </a>
            <a 
              href="/products" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View Products
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
