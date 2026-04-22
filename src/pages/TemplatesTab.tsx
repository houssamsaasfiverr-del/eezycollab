import React, { useState } from "react";
import { Search } from "lucide-react";

interface Template {
  id: number;
  name: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
}

const templates: Template[] = [
  {
    id: 1,
    name: "Discount Reminder",
    category: "Shopping",
    description: "Notify users of discounts during browsing.",
    tags: ["React", "API", "Notifications"],
    image: "https://images.unsplash.com/photo-1581090700227-86017f026b9e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 2,
    name: "Grammar Correction",
    category: "Writing",
    description: "Suggest corrections for grammar mistakes.",
    tags: ["JavaScript", "Content Scripts", "AI"],
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 3,
    name: "Tab Organizer",
    category: "Productivity",
    description: "Organize open tabs to improve workflow.",
    tags: ["React", "State Management", "Tabs API"],
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 4,
    name: "Password Manager",
    category: "Security",
    description: "Manage and autofill passwords securely.",
    tags: ["Security", "Encryption", "Storage"],
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=300&q=80",
  },
];


export const TemplatesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white min-h-screen py-12 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Browser Extension Templates</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Kickstart your extension projects with ready-to-use, handpicked templates for popular use cases.
          </p>
        </div>

        {/* Search and category filter */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 items-center mb-8">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-blue-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {filteredTemplates.map((temp) => (
            <div
              key={temp.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 flex flex-col cursor-pointer overflow-hidden"
            >
              <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={temp.image}
                  alt={temp.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-semibold mb-2 px-2 py-1 self-start rounded-full bg-blue-100 text-blue-700 uppercase">
                  {temp.category}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{temp.name}</h3>
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{temp.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {temp.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-700 text-xs font-semibold rounded px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="self-start bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
