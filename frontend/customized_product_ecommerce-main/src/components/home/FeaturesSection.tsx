import { BookOpen, Calculator, PenTool, Briefcase } from "lucide-react";
import Link from "next/link";

export const FeaturesSection = () => {
  const features = [
    {
      icon: <BookOpen className="h-12 w-12 text-blue-600" />,
      title: "School Supplies",
      description: "Complete range of notebooks, textbooks and educational materials",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/categories"
    },
    {
      icon: <Calculator className="h-12 w-12 text-teal-600" />,
      title: "Office Equipment", 
      description: "Professional calculators, organizers, and essential office tools",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
      link: "/categories"
    },
    {
      icon: <PenTool className="h-12 w-12 text-orange-600" />,
      title: "Writing Instruments",
      description: "Premium pens, pencils, markers, and writing accessories",
      bgColor: "bg-orange-50", 
      textColor: "text-orange-600",
      link: "/categories"
    },
    {
      icon: <Briefcase className="h-12 w-12 text-purple-600" />,
      title: "Professional Supplies",
      description: "Business essentials, folders, and organizational tools",
      bgColor: "bg-purple-50", 
      textColor: "text-purple-600",
      link: "/categories"
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Product Categories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Discover our comprehensive range of office and school supplies designed to meet all your professional and educational needs
          </p>
          <div className="w-24 h-1 bg-orange-500 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link key={index} href={feature.link}>
              <div 
                className={`${feature.bgColor} rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-2`}
              >
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-bold ${feature.textColor} mb-3`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className={`${feature.textColor} hover:underline font-semibold text-sm`}>
                  Explore More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
