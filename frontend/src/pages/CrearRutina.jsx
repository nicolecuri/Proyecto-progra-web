import { useEffect, useState } from "react"
import "../styles/CrearRutina.css"

function CrearRutina() {

    const [nombre, setNombre] = useState("")
    const [ejercicios, setEjercicios] = useState([
        {
            ejercicio: "",
            series: "",
            repeticiones: ""
        }
    ])

    const [rutinas, setRutinas] = useState(() => {

        const datosGuardados = localStorage.getItem("rutinas")

        return datosGuardados ? JSON.parse(datosGuardados) : []

    })
    useEffect(() => {

        localStorage.setItem("rutinas", JSON.stringify(rutinas))

    }, [rutinas])

    function agregarEjercicio() {

        setEjercicios([
            ...ejercicios,
            {
                ejercicio: "",
                series: "",
                repeticiones: ""
            }
        ])
    }
    function eliminarEjercicio(index) {

  if(ejercicios.length === 1){
    alert("Debe haber al menos un ejercicio")
    return
  }

  const nuevosEjercicios = ejercicios.filter(
    (item, i) => i !== index
  )

  setEjercicios(nuevosEjercicios)
}

    function cambiarEjercicio(index, campo, valor) {

        const nuevosEjercicios = [...ejercicios]

        nuevosEjercicios[index][campo] = valor

        setEjercicios(nuevosEjercicios)
    }

    function guardarRutina(e) {
        e.preventDefault()

        if (nombre === "") {
            alert("Ingresa un nombre")
            return
        }

        for (let item of ejercicios) {

            if (
                item.ejercicio === "" ||
                item.series === "" ||
                item.repeticiones === ""
            ) {
                alert("Completa todos los ejercicios")
                return
            }
        }

        const nuevaRutina = {
            nombre,
            ejercicios
        }

        setRutinas([...rutinas, nuevaRutina])

        setNombre("")
        setEjercicios([
            {
                ejercicio: "",
                series: "",
                repeticiones: ""
            }
        ])
    }

    function eliminarRutina(index) {

        const nuevasRutinas = rutinas.filter((rutina, i) => i !== index)

        setRutinas(nuevasRutinas)
    }

    return (
        <div className="container">

            <h1 className="title">Crear Rutina</h1>

            <form className="formulario" onSubmit={guardarRutina}>

                <input
                    type="text"
                    placeholder="Nombre rutina"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />

                {
                    ejercicios.map((item, index) => (
                        <div key={index}>

                            <input
                                type="text"
                                placeholder="Ejercicio"
                                value={item.ejercicio}
                                onChange={(e) =>
                                    cambiarEjercicio(index, "ejercicio", e.target.value)
                                }
                            />

                            <input
                                type="number"
                                placeholder="Series"
                                value={item.series}
                                onChange={(e) =>
                                    cambiarEjercicio(index, "series", e.target.value)
                                }
                            />

                            <input
                                type="number"
                                placeholder="Repeticiones"
                                value={item.repeticiones}
                                onChange={(e) =>
                                    cambiarEjercicio(index, "repeticiones", e.target.value)
                                }
                            />
                            <button
                                className="btnEliminar"
                                type="button"
                                onClick={() => eliminarEjercicio(index)}
                            >
                                -
                            </button>

                        </div>
                    ))
                }
                <button
                    type="button"
                    onClick={agregarEjercicio}
                >
                    Agregar Ejercicio
                </button>

                <button type="submit">
                    Guardar
                </button>

            </form>

            <div className="rutinas">

                {
                    rutinas.map((rutina, index) => (
                        <div className="card" key={index}>

                            <h3>{rutina.nombre}</h3>

                            {
                                rutina.ejercicios.map((item, index) => (
                                    <div className="ejercicioBox" key={index}>

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

        </div>
    )
}

export default CrearRutina