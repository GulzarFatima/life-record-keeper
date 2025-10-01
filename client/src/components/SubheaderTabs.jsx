import { NavLink } from "react-router-dom";
import "@/styles/subheader.css";

const tabs = ["Education", "Career", "Travel"];

export default function SubheaderTabs() {
  return (
    <div className="subheader">
      <nav className="subtabs">
        {tabs.map((t) => (
          <NavLink
            key={t}
            to={`/categories/${t}`}
            className={({ isActive }) => "subtab" + (isActive ? " active" : "")}
          >
            {t}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
