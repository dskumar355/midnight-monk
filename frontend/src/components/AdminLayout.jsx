import { Link } from "react-router-dom";

export default function AdminLayout({ children }) {

  return (

    <div style={{ display:"flex", minHeight:"100vh" }}>

      {/* SIDEBAR */}

      <div
        style={{
          width:220,
          background:"#111",
          padding:20,
          color:"white"
        }}
      >

        <h3>🌙 Midnight Monk</h3>

        <hr/>

        <p>
          <Link to="/admin" style={{color:"white"}}>
            Dashboard
          </Link>
        </p>

        <p>
          <Link to="/admin/orders" style={{color:"white"}}>
            Orders
          </Link>
        </p>

        <p>
          <Link to="/admin/menu" style={{color:"white"}}>
            Menu
          </Link>
        </p>

        <p>
          <Link to="/admin/analytics" style={{color:"white"}}>
            Analytics
          </Link>
        </p>

      </div>

      {/* PAGE CONTENT */}

      <div style={{ flex:1, padding:30 }}>

        {children}

      </div>

    </div>

  );

}