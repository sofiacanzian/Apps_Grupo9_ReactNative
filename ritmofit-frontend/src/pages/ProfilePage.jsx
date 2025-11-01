// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react'; 
import { useAuthStore } from '../store/authStore';
import { updateProfile, fetchProfile } from '../services/userService';
import { useNavigate } from 'react-router-dom'; // 🚨 NECESITAS ESTA IMPORTACIÓN

// =================================================================
// Componente para el formulario de edición (Modal simple)
// =================================================================
const ProfileEditModal = ({ user, onClose, onSave }) => {
    // Función auxiliar para formatear fecha de DB (AAAA-MM-DD) a input date
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // DateObject es necesario para manejar la zona horaria en el input date
        return new Date(dateString).toISOString().split('T')[0]; 
    };
    
    // Inicializar el estado del formulario con los datos actuales
    const [formData, setFormData] = useState({
        nombre: user?.nombre || '',
        telefono: user?.telefono || '',
        direccion: user?.direccion || '',
        // 🚨 INCLUIR FECHA DE NACIMIENTO EN FORMATO DE INPUT DATE 🚨
        fechaNacimiento: formatDateForInput(user?.fechaNacimiento), 
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Enviamos los datos modificados al manejador de guardado
        await onSave(formData); 
        setIsSaving(false);
        // Cerramos el modal
        onClose();
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <h3>Editar Perfil</h3>
                <form onSubmit={handleSubmit}>
                    <label>Nombre:</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    
                    <label>Teléfono:</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
                    
                    <label>Dirección:</label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />

                    {/* 🚨 CAMPO FECHA DE NACIMIENTO 🚨 */}
                    <label>Fecha Nacimiento:</label>
                    <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} />
                    
                    {/* El Email no se edita aquí, por seguridad */}
                    
                    <div style={modalStyles.actions}>
                        <button type="submit" disabled={isSaving} style={modalStyles.saveButton}>
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button type="button" onClick={onClose} style={modalStyles.cancelButton} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// =================================================================
// Componente Principal ProfilePage
// =================================================================
const ProfilePage = () => {
    // 🚨 Importar useNavigate para la redirección de Logout 🚨
    const navigate = useNavigate(); 
    
    // El signOut no existe en useAuthStore, usamos logout
    const { user, logout } = useAuthStore(); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(user); 

    // Función para guardar los cambios
    const handleSave = async (data) => {
        try {
            const updatedUser = await updateProfile(data);
            
            // Actualizar el estado global de Zustand
            useAuthStore.setState({ user: updatedUser });
            setProfileData(updatedUser); // Actualizar el estado local para que se muestre en la página
            
            alert('Perfil actualizado con éxito!');
        } catch (error) {
            alert(`Error al guardar: ${error.message}`);
        }
    };

    // 🚨 MANEJADOR CORREGIDO DE LOGOUT 🚨
    const handleLogout = () => {
        logout(); // Limpia el estado y localStorage
        // Forzamos la redirección a la página de login
        navigate('/auth/login', { replace: true }); 
    };
    
    // ... useEffect y lógica de carga ...

    if (!profileData) {
        return <p>Cargando datos del perfil...</p>;
    }

    // Función auxiliar
    const formatRole = (rol) => rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : '';
    const formattedBirthDate = profileData.fechaNacimiento 
        ? new Date(profileData.fechaNacimiento).toLocaleDateString('es-AR') 
        : 'No especificada';

    return (
        <div style={styles.container}>
            <h1>Perfil de Socio</h1>
            
            <div style={styles.infoBox}>
                <h2>Datos Personales</h2>
                <p><strong>Nombre:</strong> {profileData.nombre || 'N/A'}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Teléfono:</strong> {profileData.telefono || 'No especificado'}</p>
                <p><strong>Dirección:</strong> {profileData.direccion || 'No especificada'}</p>
                <p><strong>Fecha Nac.:</strong> {formattedBirthDate}</p> {/* 🚨 MOSTRAR CAMPO */}
                <p><strong>Rol:</strong> <span style={styles.roleTag}>{formatRole(profileData.rol)}</span></p>
            </div>

            <div style={styles.actions}>
                <button onClick={() => setIsModalOpen(true)} style={styles.editButton}>
                    Ver/Editar Datos
                </button>
                {/* 🚨 CONECTAR AL MANEJADOR CORREGIDO 🚨 */}
                <button onClick={handleLogout} style={styles.logoutButton}>
                    Cerrar Sesión (Logout)
                </button>
            </div>

            {isModalOpen && (
                <ProfileEditModal 
                    user={profileData} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                />
            )}
        </div>
    );
};

// Estilos para el ProfilePage (simplificado)
const styles = {
    container: { maxWidth: '600px', margin: 'auto' },
    infoBox: { border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f9f9f9' },
    roleTag: { backgroundColor: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9em' },
    actions: { display: 'flex', gap: '10px', justifyContent: 'center' },
    editButton: { backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
    logoutButton: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
};

// Estilos del Modal (simplificado)
const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    actions: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    saveButton: { backgroundColor: '#4CAF50', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    cancelButton: { backgroundColor: '#ccc', color: '#333', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
};

export default ProfilePage;