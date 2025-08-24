import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageSquare,
  Users,
  Headphones,
  CheckCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Custom School Stationary & Uniforms",
  description: "Get in touch with Office Shop for custom school stationary, uniforms, and educational products. Contact our team for bulk orders, custom solutions, and support.",
  keywords: "contact us, school stationary contact, custom uniforms inquiry, bulk orders, customer support",
  openGraph: {
    title: "Contact Us | Custom School Stationary & Uniforms",
    description: "Get in touch with Office Shop for custom school stationary, uniforms, and educational products.",
    type: "website",
  },
};

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Contact Us" }
];

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Our Office",
    details: [
      "123 Business Street",
      "Commercial Area, City 12345",
      "Near Central School District"
    ],
    color: "blue"
  },
  {
    icon: Phone,
    title: "Call Us",
    details: [
      "+91 1234567890",
      "+91 0987654321",
      "Mon - Sat: 9:00 AM - 6:00 PM"
    ],
    color: "orange"
  },
  {
    icon: Mail,
    title: "Email Us",
    details: [
      "info@officeshop.com",
      "orders@officeshop.com",
      "support@officeshop.com"
    ],
    color: "teal"
  },
  {
    icon: Clock,
    title: "Business Hours",
    details: [
      "Monday - Friday: 9:00 AM - 6:00 PM",
      "Saturday: 10:00 AM - 4:00 PM",
      "Sunday: Closed"
    ],
    color: "purple"
  }
];

const departments = [
  {
    icon: Users,
    title: "Sales & Orders",
    description: "For new orders, bulk purchases, and product inquiries",
    email: "sales@officeshop.com",
    phone: "+91 1234567890"
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "For existing orders, returns, and general support",
    email: "support@officeshop.com",
    phone: "+91 0987654321"
  },
  {
    icon: MessageSquare,
    title: "Custom Solutions",
    description: "For custom designs, special requirements, and partnerships",
    email: "custom@officeshop.com",
    phone: "+91 1122334455"
  }
];

const faqs = [
  {
    question: "What is the minimum order quantity?",
    answer: "Our minimum order quantity varies by product. For uniforms, it's typically 25 pieces per design. For stationary items, it's usually 100 pieces. Contact us for specific requirements."
  },
  {
    question: "How long does custom production take?",
    answer: "Custom production typically takes 7-14 business days depending on the complexity and quantity. Rush orders can be accommodated with additional charges."
  },
  {
    question: "Do you offer samples before bulk orders?",
    answer: "Yes, we provide samples for most products. Sample costs are typically deducted from your final order if you proceed with the purchase."
  },
  {
    question: "What are your payment terms?",
    answer: "We accept various payment methods including bank transfers, credit cards, and for established customers, we offer net 30 payment terms."
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get In <span className="text-blue-600">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your school's identity with premium custom products? 
              Our team is here to help you every step of the way.
            </p>
            <div className="w-24 h-1 bg-orange-500 mx-auto mt-8"></div>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className={`bg-${info.color}-100 w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                  <info.icon className={`h-6 w-6 text-${info.color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{info.title}</h3>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization/School Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your school or organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select 
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select inquiry type</option>
                    <option value="bulk-order">Bulk Order</option>
                    <option value="custom-design">Custom Design</option>
                    <option value="product-inquiry">Product Inquiry</option>
                    <option value="partnership">Partnership</option>
                    <option value="support">Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea 
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Please provide details about your requirements, quantities, timeline, and any specific needs..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information & Departments */}
            <div className="space-y-8">
              {/* Departments */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Departments</h3>
                <div className="space-y-6">
                  {departments.map((dept, index) => (
                    <div key={index} className="border-l-4 border-blue-600 pl-6">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <dept.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{dept.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{dept.description}</p>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-600 font-medium">{dept.email}</p>
                            <p className="text-sm text-gray-600">{dept.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Response Promise */}
              <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-full mr-4">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Our Promise</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Response within 2 hours during business hours
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Free consultation and quotation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Dedicated account manager for bulk orders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Sample approval before production
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Quick answers to common questions about our products and services.
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Can't find what you're looking for?</p>
            <a 
              href="mailto:info@officeshop.com" 
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Mail className="h-5 w-5 mr-2" />
              Email Us Directly
            </a>
          </div>
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Our Location</h2>
            <p className="text-gray-600">
              Visit our showroom to see our products firsthand and meet our team.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Interactive Map</h3>
                <p className="text-gray-500">
                  123 Business Street, Commercial Area<br />
                  City 12345, State, Country
                </p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
