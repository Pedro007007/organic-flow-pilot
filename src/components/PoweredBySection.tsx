import { Shield } from "lucide-react";

const integrations = [
  { name: "Google Search Console", desc: "Real search data" },
  { name: "Google AI Overviews", desc: "AI citation tracking" },
  { name: "OpenAI / ChatGPT", desc: "Content & analysis" },
  { name: "Perplexity AI", desc: "Answer monitoring" },
  { name: "Schema.org", desc: "Structured data" },
];

const PoweredBySection = () => {
  return (
    <section className="bg-white py-16 border-t border-gray-100">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            <Shield className="h-4 w-4" />
            Powered By Industry-Leading Technology
          </div>
          <p className="text-sm text-gray-500 font-medium max-w-lg mx-auto">
            Searchera connects directly to the platforms that matter — pulling real data, not estimates.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-gray-150 bg-gray-50/60 px-5 py-3.5 hover:border-gray-300 hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 shrink-0">
                <span className="text-xs font-black text-gray-500">
                  {item.name.split(" ")[0][0]}{item.name.split(" ").length > 1 ? item.name.split(" ")[1][0] : ""}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{item.name}</p>
                <p className="text-[11px] font-medium text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PoweredBySection;
