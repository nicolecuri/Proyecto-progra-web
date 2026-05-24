import { useEffect, useState } from "react"

function Admin() {

    const [rutinas, setRutinas] = useState([])

    useEffect(() => {

        const datos = JSON.parse(localStorage.getItem("rutinas")) || []

        setRutinas(datos)

    }, [])

    function eliminarRutina(index) {

        const nuevasRutinas = rutinas.filter((rutina, i) => i !== index)

        setRutinas(nuevasRutinas)

        localStorage.setItem("rutinas", JSON.stringify(nuevasRutinas))
    }

    return (
        <div>

            <h1>Vista Admin</h1>

            {
                rutinas.length === 0
                    ?
                    <p>No hay rutinas registradas</p>
                    :
                    rutinas.map((rutina, index) => (
                        <div key={index}>

                            <h3>{rutina.nombre}</h3>

                            {
                                rutina.ejercicios.map((item, index) => (
                                    <div key={index}>

                                        <p>Ejercicio: {item.ejercicio}</p>

                                        <p>Series: {item.series}</p>

                                        <p>Repeticiones: {item.repeticiones}</p>

                                        <hr />

                                    </div>
                                ))
                            }

                            <button onClick={() => eliminarRutina(index)}>
                                Eliminar
                            </button>

                        </div>
                    ))
            }

        </div>
    )
}

export default Admin