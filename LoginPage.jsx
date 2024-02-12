import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { getGroups } from '../api/groups.api';
import { getReports } from '../api/reports.api'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Card, Col, Form, FormGroup, FormControl, FormLabel, Button, Container, Image, Modal, FormCheck } from 'react-bootstrap';
import FondoSvg from '../assets/fondo.svg';
import Logo from '../assets/logo-essalud.svg';
import { generarPDF } from '../utils/generarPDF'

export function LoginPage() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [groups, setGroups] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);

    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const [camposCompletos, setCamposCompletos] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=6LfJ-TkpAAAAAGk-luwLSzw3ihrxMprK85ckCalL';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        const fetchData = async () => {
            try {
                const groupsResponse = await getGroups();
                const reportsResponse = await getReports();

                setGroups(groupsResponse.data);
                setReports(reportsResponse.data);
            } catch (error) {
                console.error('Error al obtener datos:', error);
            }
        };

        fetchData();

        return () => {
            // Cleanup: remove the script when the component unmounts
            document.head.removeChild(script);
        };

    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // Use the reCAPTCHA v3 API to verify the user
            const capResponse = await window.grecaptcha.execute('6LfJ-TkpAAAAAGk-luwLSzw3ihrxMprK85ckCalL', {
                action: 'login',
            });

            if (!capResponse) {
                toast.error('Validación reCAPTCHA fallida. Por favor, inténtalo de nuevo.');
                return;
            }

            const response = await login({ ...credentials, recaptchaToken: capResponse });
            const accessToken = response.data.token;
            const expirationTime = jwtDecode(accessToken).exp;
            localStorage.setItem('access', accessToken);
            localStorage.setItem('expirationTime', expirationTime);
            toast.success('Sesión iniciada correctamente.');
            navigate('/menu');
        } catch (error) {
            setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            console.error('Credenciales incorrectas. Por favor, inténtalo de nuevo.', error);
            toast.error('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
        }
    };

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    const [datos, setDatos] = useState({
        dni: '',
        nombreCompleto: '',
        cargoSolicitante: '',
        correoInstitucional: '',
        celular: '',
        nombreJefeInmediato: '',
        cargoJefeInmediato: '',
        moduloSolicitado: [],
        reportesSolicitados: [],
        regimenLaboral: [],
        sustentoPedido: '',
    });

    const handleChangeForm = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            // Manejar cambios en campos checkbox
            if (name === 'moduloSolicitado') {
                // Obtener el nombre del grupo en lugar del id
                const selectedGroupName = groups.find((group) => group.id === parseInt(value, 10))?.nombre;

                setDatos({
                    ...datos,
                    [name]: checked ? [...datos[name], selectedGroupName] : datos[name].filter((item) => item !== selectedGroupName),
                });
            } else {
                // Otros campos checkbox (puedes mantener el manejo actual si es necesario)
                setDatos({
                    ...datos,
                    [name]: checked ? [...datos[name], value] : datos[name].filter((item) => item !== value),
                });
            }
        } else {
            // Manejar cambios en otros campos
            setDatos({ ...datos, [name]: value });
        }
        const obligatoriosCompletos = (
            datos.dni !== '' &&
            datos.nombreCompleto !== '' &&
            datos.cargoSolicitante !== '' &&
            datos.correoInstitucional !== '' &&
            datos.celular !== '' &&
            datos.nombreJefeInmediato !== '' &&
            datos.cargoJefeInmediato !== '' &&
            datos.moduloSolicitado.length > 0 && // Al menos un módulo seleccionado
            datos.reportesSolicitados.length > 0 && // Al menos un reporte seleccionado
            datos.regimenLaboral.length > 0 &&
            datos.sustentoPedido !== ''
        );

        setCamposCompletos(obligatoriosCompletos);
    };
    const handleChangeGroups = (e) => {

        const { value, checked } = e.target;

        if (checked) {
            // Agregar el grupo seleccionado
            setSelectedGroups([...selectedGroups, value]);
        } else {
            // Eliminar el grupo no seleccionado
            setSelectedGroups(selectedGroups.filter((group) => group !== value));
        }
    };


    const filteredReports = reports.filter((report) => {
        console.log(selectedGroups);
        return selectedGroups.some((selectedGroups) => report.groupId == selectedGroups);
    });

    console.log(filteredReports);

    return (
        <Container
            style={{ background: `url(${FondoSvg})`, minHeight: '100vh' }}
            fluid
            className="d-flex align-items-center justify-content-center"
        >
            <Row>
                <Col lg={7} md={6} xs={12} className="d-flex justify-content-center align-items-center p-5">
                    <div className="text-white">
                        <h1 className="d-block d-sm-none text-center">Sistema de Analítica de Datos</h1>
                        <h1 className="d-none d-md-block">Sistema de Analítica de Datos</h1>
                        <p className="d-none d-sm-block">
                            Sistema institucional de EsSalud que pone a disposición los tableros de mando y control desarrollados con
                            business intelligence y business analytics para la toma de decisiones en el marco del gobierno de datos.
                        </p>
                    </div>
                </Col>
                <Col lg={5} md={6} xs={12} className="d-flex flex-column align-items-center">
                    <Card className="p-4" style={{ width: '22.9rem' }}>
                        <Form onSubmit={handleLogin}>
                            <div className="text-center mb-4">
                                <Image src={Logo} alt="Logo" />
                            </div>

                            <FormGroup controlId="username" className="mb-3">
                                <FormLabel>Usuario</FormLabel>
                                <FormControl type="text" name="username" value={credentials.username} onChange={handleChange} />
                            </FormGroup>

                            <FormGroup controlId="password" className="mb-3">
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl type="password" name="password" value={credentials.password} onChange={handleChange} />
                            </FormGroup>
                            <Button variant="primary" type="submit" className="w-100 mt-3">
                                Entrar
                            </Button>
                            {/* <div className="mt-3 text-center">
                                <Button variant="link" className="text-primary" onClick={handleShowModal}>
                                    Solicitar Acceso
                                </Button>
                            </div> */}
                        </Form>
                    </Card>
                    <Modal show={showModal} onHide={handleCloseModal} size="xl">
                        <Modal.Header closeButton>
                            <Modal.Title>Solicitar Acceso</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row className='pt-1'>
                                    <Col md={4}>
                                        <Form.Group controlId="formDni">
                                            <Form.Label>DNI del solicitante: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="dni"
                                                value={datos.dni}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tu DNI"
                                            />
                                        </Form.Group>

                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId="formNombre">
                                            <Form.Label>Nombres del solicitante: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombre"
                                                value={datos.nombre}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tus nombres"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId="formApellido">
                                            <Form.Label>Apellidos del solicitante: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="apellido"
                                                value={datos.apellido}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tus apellidos"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='pt-1'>
                                    <Col md={6}>
                                        <Form.Group controlId="formCargoSolicitante">
                                            <Form.Label>Cargo del solicitante: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="cargoSolicitante"
                                                value={datos.cargoSolicitante}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tu cargo"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formCorreoInstitucional">
                                            <Form.Label>Correo institucional: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="correoInstitucional"
                                                value={datos.correoInstitucional}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tu correo institucional"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='pt-1'>
                                    <Col md={12}>
                                        <Form.Group controlId="formCelular">
                                            <Form.Label>Celular: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="celular"
                                                value={datos.celular}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa tu número de celular"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='pt-1'>
                                    <Col md={6}>
                                        <Form.Group controlId="formNombreJefeInmediato">
                                            <Form.Label>Nombre del jefe inmediato: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombreJefeInmediato"
                                                value={datos.nombreJefeInmediato}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa el nombre de tu jefe inmediato"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formCargoJefeInmediato">
                                            <Form.Label>Cargo del jefe inmediato: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="cargoJefeInmediato"
                                                value={datos.cargoJefeInmediato}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa el cargo de tu jefe inmediato"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='pt-1'>
                                    <Col md={4}>
                                        <Form.Group controlId="formModuloSolicitado">
                                            <Form.Label>Módulo solicitado: {/* Obligatorio */}</Form.Label>
                                            <FormGroup>
                                                {groups.map((group) => (
                                                    <FormCheck
                                                        type="checkbox"
                                                        label={`${group.nombre}`}
                                                        name="moduloSolicitado"
                                                        value={group.id}
                                                        onChange={(e) => {
                                                            handleChangeForm(e);
                                                            handleChangeGroups(e);
                                                        }}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Group controlId="formReportesSolicitados">
                                            <Form.Label>Reportes solicitados: {/* Obligatorio */}</Form.Label>
                                            <FormGroup>
                                                {filteredReports.map((report) => (
                                                    <FormCheck
                                                        type="checkbox"
                                                        label={report.nombre}
                                                        name="reportesSolicitados"
                                                        value={report.nombre}
                                                        onChange={handleChangeForm}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group controlId="formRegimenLaboral">
                                            <Form.Label>Régimen laboral: {/* Obligatorio */}</Form.Label>
                                            <FormGroup>
                                                <FormCheck
                                                    type="checkbox"
                                                    label="D.L. 276"
                                                    name="regimenLaboral"
                                                    value="D.L. 276"
                                                    onChange={handleChangeForm}
                                                />
                                                <FormCheck
                                                    type="checkbox"
                                                    label="D.L. 728"
                                                    name="regimenLaboral"
                                                    value="D.L. 728"
                                                    onChange={handleChangeForm}
                                                />
                                                <FormCheck
                                                    type="checkbox"
                                                    label="CAS"
                                                    name="regimenLaboral"
                                                    value="CAS"
                                                    onChange={handleChangeForm}
                                                />
                                                <FormCheck
                                                    type="checkbox"
                                                    label="Externo"
                                                    name="regimenLaboral"
                                                    value="Externo"
                                                    onChange={handleChangeForm}
                                                />
                                                {/* Agregar más regímenes según sea necesario */}
                                            </FormGroup>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='pt-1'>
                                    <Col md={12}>
                                        <Form.Group controlId="formSustentoPedido">
                                            <Form.Label>Sustento del pedido: {/* Obligatorio */}</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="sustentoPedido"
                                                value={datos.sustentoPedido}
                                                onChange={handleChangeForm}
                                                placeholder="Ingresa el sustento de tu pedido"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="primary"
                                onClick={() => generarPDF(datos)}
                                disabled={!camposCompletos} // Deshabilita el botón si los campos no están completos
                            >
                                Generar y Descargar PDF
                            </Button>
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cerrar
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Col>
            </Row>
        </Container>
    );
}