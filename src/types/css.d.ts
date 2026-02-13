/**
 * تعريف أنواع ملفات CSS و CSS Modules لبيئة TypeScript.
 * هذا الملف يحل مشكلة: Cannot find module './Dashboard.module.css'
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}