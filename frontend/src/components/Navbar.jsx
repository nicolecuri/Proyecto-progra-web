import { Link } from "react-router-dom"

function Navbar() {

  return (

    <nav className="navbar">

      <h2>FitTrack</h2>

      <ul>

        <li>
          <Link to="/">
            Crear Rutina
          </Link>
        </li>

        <li>
          <Link to="/admin">
            Admin
          </Link>
        </li>

      </ul>

    </nav>
  )
}

export default Navbar