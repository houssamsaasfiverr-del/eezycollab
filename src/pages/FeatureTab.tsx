import React from "react";

const features = [
  {
    title: "AI Code Generation",
    description: "Instantly turn your prompt into full code with contextual understanding.",
    imgSrc: "/images/feature-ai-code.png",
    bgColor: "bg-blue-100",
  },
  {
    title: "Live Preview & IDE",
    description: "Write code, see previews instantly, no setup or reloads needed.",
    imgSrc: "/images/feature-live-preview.png",
    bgColor: "bg-purple-100",
  },
  {
    title: "One-Click Deployment",
    description: "Deploy your app globally with a click, including SSL and CDN.",
    imgSrc: "/images/feature-deploy.png",
    bgColor: "bg-green-100",
  },
  {
    title: "Full Stack Integration",
    description: "Composer your frontend, backend, and database seamlessly.",
    imgSrc: "/images/feature-full-stack.png",
    bgColor: "bg-yellow-100",
  },
];

export const FeaturesTab: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-bold text-center mb-12 text-gray-900">
          Explore Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {features.map(({ title, description, imgSrc, bgColor }, i) => (
            <div
              key={i}
              className={`flex flex-col items-center p-6 rounded-2xl shadow-md transition hover:shadow-xl cursor-pointer ${bgColor}`}
            >
              <div className="w-full flex justify-center mb-4">
                <img
                  src={imgSrc}
                  alt={`${title} Illustration`}
                  className="rounded-lg object-contain max-h-48"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</h3>
              <p className="text-gray-700 text-center max-w-xs">{description}</p>
              <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
