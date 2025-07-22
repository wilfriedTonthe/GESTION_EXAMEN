import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import SecurityService from '../services/securityService';

const ExamSecurityMonitor = ({ examId, onSecurityViolation, onExamSubmit }) => {
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [violation, setViolation] = useState(null);

  // Vérifier périodiquement l'état de la sécurité
  const checkSecurityStatus = useCallback(async () => {
    try {
      const status = await SecurityService.checkSecurityStatus(examId);
      setSecurityStatus(status);
      
      // Vérifier les violations de sécurité
      if (status.violations && status.violations.length > 0) {
        setViolation(status.violations[0]);
        if (onSecurityViolation) {
          onSecurityViolation(status.violations[0]);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de la sécurité:', err);
      setError('Impossible de vérifier l\'état de sécurité');
    }
  }, [examId, onSecurityViolation]);

  // Démarrer la surveillance de sécurité
  const startSecurity = async () => {
    setLoading(true);
    setError(null);
    try {
      await SecurityService.startExamSecurity(examId);
      // Commencer la vérification périodique
      const intervalId = setInterval(checkSecurityStatus, 30000); // Toutes les 30 secondes
      return () => clearInterval(intervalId);
    } catch (err) {
      setError('Échec du démarrage de la surveillance de sécurité');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Soumettre l'examen
  const handleSubmitExam = async (answers) => {
    setLoading(true);
    try {
      await SecurityService.submitExam(examId, answers);
      if (onExamSubmit) {
        onExamSubmit();
      }
    } catch (err) {
      setError('Échec de la soumission de l\'examen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'arrêt d'urgence
  const handleEmergencyStop = async () => {
    setShowEmergencyModal(true);
  };

  const confirmEmergencyStop = async () => {
    setLoading(true);
    try {
      await SecurityService.emergencyStop(examId);
      setShowEmergencyModal(false);
      // Rediriger ou afficher un message de confirmation
    } catch (err) {
      setError('Échec de l\'arrêt d\'urgence');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Démarrer la surveillance au chargement du composant
  useEffect(() => {
    startSecurity();
    // Nettoyer à la fin de l'examen
    return () => {
      // Nettoyage si nécessaire
    };
  }, [examId]);

  return (
    <div className="exam-security-monitor">
      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {violation && (
        <Alert variant="warning" className="mb-3">
          <strong>Violation de sécurité détectée :</strong> {violation.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5>Surveillance de sécurité active</h5>
          <p className="mb-0">
            Statut : <span className="text-success">Actif</span>
          </p>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={handleEmergencyStop}
          disabled={loading}
        >
          Arrêt d'urgence
        </Button>
      </div>

      {/* Modal d'arrêt d'urgence */}
      <Modal show={showEmergencyModal} onHide={() => setShowEmergencyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer l'arrêt d'urgence</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir arrêter la surveillance de sécurité ?</p>
          <p className="text-danger">
            <strong>Attention :</strong> Cette action est irréversible et peut invalider votre examen.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmergencyModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmEmergencyStop} disabled={loading}>
            {loading ? 'Traitement...' : 'Confirmer l\'arrêt'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExamSecurityMonitor;
