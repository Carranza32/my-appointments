# Antigravity Frontend Design System Instructions (React JSX)

> [!NOTE]
> Copy this file directly into any new React JSX (JavaScript) project. You can feed this document to Antigravity as a context/reference instructions file, and tell it: *"Apply the layout, colors, and components defined in `antigravity_frontend_guidelines.md` to create my pages."*

---

## 1. Context & Role for Antigravity AI
When building pages or components in this codebase, you must strictly follow the visual style, colors, and spacing described below. Every interface must look modern, premium, and clean, using rounded borders, subtle gradients, and elegant hover animations.

*   **Language**: JavaScript (`.jsx` / `.js`). Do NOT use TypeScript annotations, types (`React.FC`, interfaces), or generic brackets.
*   **Styling**: Tailwind CSS + custom CSS variables.
*   **Icons**: Lucide React.
*   **Animations**: Framer Motion.

---

## 2. Design System Tokens (Tailwind CSS)

### Font Configurations
Include Google Fonts for `Inter` (body) and `Outfit` (headings) in the project.
*   **Heading Font**: `Outfit` (font-family style for all `h1`, `h2`, `h3`, `h4`, `h5`, `h6`).
*   **Sans Font**: `Inter` (for all tables, metadata, inputs, and paragraphs).

### Custom Color Palette
Ensure these colors are mapped in the Tailwind configuration or defined as CSS variables:
*   `brand-slate`: `#0F172A` (deep dark navy).
*   `brand-card`: `#1E293B` (slate card background).
*   `brand-indigo`: `#4F46E5` (primary brand color).
*   `brand-green`: `#10B981` (active states, positive logs).
*   `brand-red`: `#EF4444` (danger states, inactive logs).

---

## 3. UI Layout Blueprint

### A. Main App Container (Viewport Constraints)
Avoid general page scrolling. Lock the page view height and allow inner containers to scroll:
```jsx
// Base wrapper for dashboards
<div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
  {/* Sidebar sits here */}
  {/* Main content area wraps header + scrollable canvas */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header sits here */}
    <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
      {/* Dynamic page content */}
    </main>
  </div>
</div>
```

---

## 4. Reusable Core Components (Pure JSX)

### A. Sidebar Navigation (`Sidebar.jsx`)
```jsx
import React from 'react';
import { Shield, LayoutDashboard, Users, LogOut, Settings } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  const menuItems = [
    { id: 'dashboard', name: 'Vista General', icon: LayoutDashboard },
    { id: 'users', name: 'Usuarios', icon: Users },
    { id: 'settings', name: 'Configuraciones', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div>
        {/* Brand/Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold font-heading text-white text-base leading-tight">AdminPanel</h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Console v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Area */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
```

### B. Header Component (`Header.jsx`)
```jsx
import React from 'react';

export default function Header({ sectionTitle, userName, userRole }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
      <div className="text-slate-400 text-xs font-semibold">
        Administración / <span className="text-slate-700 capitalize">{sectionTitle}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-bold text-sm text-slate-800">{userName}</div>
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {userRole}
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-200">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
            alt="Avatar" 
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
```

### C. Statistics Cards Grid
```jsx
// Responsive grid layout for metrics
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Card 1 */}
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Métrica de Ventas</div>
    <div>
      <div className="text-3xl font-extrabold font-heading text-slate-800">$12,450.00</div>
      <div className="text-[10px] text-emerald-500 font-bold mt-1">+12% este mes</div>
    </div>
  </div>

  {/* Card 2 */}
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios Activos</div>
    <div>
      <div className="text-3xl font-extrabold font-heading text-slate-800">1,248</div>
      <div className="text-[10px] text-slate-500 mt-1">98 cuentas registradas hoy</div>
    </div>
  </div>
</div>
```

### D. Flat-UI Data Table (`DataTable.jsx`)
```jsx
import React from 'react';
import { Eye, Trash2 } from 'lucide-react';

export default function DataTable({ headers, data, onActionView, onActionDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {headers.map((h, i) => (
                <th key={i} className={`p-4 ${i === 0 ? 'pl-6' : ''}`}>{h}</th>
              ))}
              <th className="p-4 pr-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="p-8 text-center text-slate-400 text-xs">
                  No hay datos disponibles en esta tabla.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="p-4 pl-6 font-bold text-slate-900">{row.name}</td>
                  <td className="p-4 text-slate-500">{row.detail}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      row.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {row.status === 'Active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => onActionView(row)} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer inline-flex"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onActionDelete(row.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer inline-flex"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 5. UI Guidelines & Rules for Antigravity AI
1.  **Strictly rounded corners**: Use `rounded-2xl` (16px) for cards, modals, and wrappers. Use `rounded-xl` (12px) for form inputs, dropdowns, and button elements.
2.  **Harmonious Badges**: Never output harsh raw text or saturated color tags. Always style badges using light backgrounds and matching border outlines: `bg-{color}-50 text-{color}-600 border border-{color}-200`.
3.  **Smooth hover states**: Apply `transition-all duration-200` to buttons, navigation tabs, links, and table rows to ensure smooth micro-interactions.
4.  **No generic outlines**: For form inputs, style focusing using `focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`.
5.  **Fonts**: Always match titles with `font-heading` (`Outfit`) and body text with `font-sans` (`Inter`).
