
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/use-auth.js";
import "@/styles/navbar.css";


export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar surface">
      <div className="nav-left">

      <Link className="brand" to="/">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="Life Record Keeper"
            className="logo"
          />
        </Link>

        <NavLink to="/pages/About">About</NavLink>
        <NavLink to="/pages/Support">Feedback & Support</NavLink>
    
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <span className="muted" style={{ marginRight: 12 }}>
              {user.email}
            </span>
            <Link className="btn" to="/account/settings">Settings</Link>
            <button className="btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="btn" to="/login">Login</Link>
            <Link className="btn primary" to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
