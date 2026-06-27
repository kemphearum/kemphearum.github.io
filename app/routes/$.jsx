import NotFound from "../../src/pages/NotFound";

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export function meta() {
  const language = getMetaLanguage();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  return [
    { title: `${tr('404 - Lost in Space', '404 - រកផ្លូវមិនឃើញ')} | Kem Phearum` },
    { name: "description", content: tr("The page you are looking for does not exist.", "ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានទេ។") }
  ];
}

export default NotFound;
