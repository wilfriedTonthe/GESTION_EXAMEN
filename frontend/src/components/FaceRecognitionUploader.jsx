import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  Divider,
  SimpleGrid,
  Spinner,
  useColorModeValue,
  Icon,
  FormControl,
  Input,
  FormErrorMessage
} from '@chakra-ui/react';
import { AttachmentIcon, CheckIcon } from '@chakra-ui/icons';
import SecurityService from '../services/securityService';
import PropTypes from 'prop-types';

/**
 * Composant pour téléverser des images d'étudiants pour la reconnaissance faciale
 * Ce composant est utilisé par les enseignants pour téléverser des images d'étudiants
 * lors de la création ou de la modification d'un examen
 */
const FaceRecognitionUploader = ({ examId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [uploadedImages, setUploadedImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Gérer la sélection de fichiers
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  // Téléverser les images sélectionnées
  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Veuillez sélectionner au moins une image");
      return;
    }

    console.log('Début du téléversement:', {
      examId,
      filesCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const response = await SecurityService.uploadExamImages(examId, files);
      console.log('Upload successful:', response.data);
      setUploadSuccess(true);
      setUploadedImages(files.map(file => file.name));
      console.log('Images téléversées avec succès:', response);
    } catch (err) {
      console.error('Erreur complète de téléversement:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError(`Erreur lors du téléversement: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Générer les signatures faciales pour l'examen
  const handleGenerateSignatures = async () => {
    setGenerating(true);
    setError(null);
    setGenerationError(null);
    setGenerationSuccess(false);

    try {
      const response = await SecurityService.generateExamSignatures(examId);
      setGenerationSuccess(true);
      console.log('Signatures générées avec succès:', response);
    } catch (err) {
      setGenerationError(`Erreur lors de la génération des signatures: ${err.message}`);
      console.error('Erreur de génération:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = () => {
      setFiles([]);
      setUploadedImages([]);
      setUploadSuccess(false);
      setError(null);
      setGenerating(false);
      setGenerationSuccess(false);
      setGenerationError(null);
      setResetting(false);
      setResetSuccess(false);
      setResetError(null);
  };

  const handleReset = async () => {
    setResetting(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const response = await SecurityService.deleteFacialData(examId);
      setResetSuccess(true);
      handleClear(); // Réinitialise l'état de l'interface
      console.log('Données réinitialisées avec succès:', response);
    } catch (err) {
      setResetError(`Erreur lors de la réinitialisation des données: ${err.message}`);
      console.error('Erreur de réinitialisation:', err);
    } finally {
      setResetting(false);
    }
  };

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.700');

  return (
    <Box
      p={4}
      mb={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
    >
      <Heading size="md" mb={2} display="flex" alignItems="center">
        <Icon as={AttachmentIcon} mr={2} />
        Reconnaissance Faciale - Images des Étudiants
      </Heading>
      
      <Text color="gray.500" mb={4}>
        Téléversez des photos des étudiants autorisés à passer cet examen. 
        Les noms des fichiers doivent correspondre aux noms des étudiants.
      </Text>

      <VStack spacing={4} align="stretch">
        {/* Section de sélection et de téléversement */}
        {!uploadSuccess && (
          <FormControl isInvalid={!!error}>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button as="span" leftIcon={<AttachmentIcon />} variant="outline" cursor="pointer" isDisabled={uploading}>
                Sélectionner des images
              </Button>
            </label>
            {files.length > 0 && (
              <Text fontSize="sm" mt={2}>
                {files.length} fichier(s) sélectionné(s).
              </Text>
            )}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        )}

        {/* Liste des fichiers sélectionnés */}
        {files.length > 0 && !uploadSuccess && (
          <List spacing={2}>
            {files.map((file, index) => (
              <ListItem key={index} fontSize="sm">
                {file.name}
              </ListItem>
            ))}
          </List>
        )}

        {/* Bouton de téléversement */}
        {files.length > 0 && !uploadSuccess && (
          <Button
            onClick={handleUpload}
            isLoading={uploading}
            loadingText="Téléversement..."
            colorScheme="blue"
            disabled={uploading || files.length === 0}
          >
            Téléverser les images
          </Button>
        )}

        {/* Message de succès global */}
        {uploadSuccess && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Téléversement terminé !</AlertTitle>
              <AlertDescription display="block">
                Les images suivantes ont été ajoutées :
                <List spacing={2} mt={2}>
                  {uploadedImages.map((imageName, index) => (
                    <ListItem key={index}>{imageName}</ListItem>
                  ))}
                </List>
              </AlertDescription>
            </Box>
          </Alert>
        )}


        {/* Section de génération des signatures */}
        {(uploadSuccess || uploadedImages.length > 0) && (
          <>
            <Divider my={4} />
            <Button 
              onClick={handleGenerateSignatures}
              isLoading={generating}
              loadingText="Génération..."
              colorScheme="green"
              leftIcon={<CheckIcon />}
              disabled={generating}
            >
              Générer les Signatures Faciales
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleReset}
              isLoading={resetting}
              ml={4}
            >
              Réinitialiser
            </Button>
          </>
        )}

        {generationSuccess && (
          <Alert status="success" mt={4}>
            <AlertIcon />
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>Les signatures faciales ont été générées avec succès.</AlertDescription>
          </Alert>
        )}

        {generationError && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            <AlertTitle>Erreur de Génération</AlertTitle>
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {resetSuccess && (
          <Alert status="success" mt={4}>
            <AlertIcon />
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>Les données ont été réinitialisées. Vous pouvez maintenant téléverser de nouvelles images.</AlertDescription>
          </Alert>
        )}

        {resetError && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            <AlertTitle>Erreur de Réinitialisation</AlertTitle>
            <AlertDescription>{resetError}</AlertDescription>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

FaceRecognitionUploader.propTypes = {
  examId: PropTypes.string.isRequired
};

export default FaceRecognitionUploader;
