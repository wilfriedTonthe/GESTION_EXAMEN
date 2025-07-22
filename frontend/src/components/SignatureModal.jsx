import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { FaFileImage } from 'react-icons/fa';
import api from '../services/api'; // Assurez-vous que votre instance axios est configurée

const SignatureModal = ({ isOpen, onClose, exam }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = (event) => {
    // On s'assure de bien récupérer tous les fichiers sélectionnés
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: 'Aucun fichier sélectionné.',
        description: 'Veuillez sélectionner au moins une photo.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    setIsUploading(true);

    try {
      await api.post(`/exams/${exam.id}/signatures`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Signatures téléversées.',
        description: `Les photos pour l'examen "${exam.title}" ont été enregistrées.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFiles([]);
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur de téléversement.',
        description: error.response?.data?.detail || 'Un problème est survenu.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gérer les signatures pour "{exam?.title}"</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Text>
              Téléversez les photos des étudiants autorisés à passer cet examen. 
              Ces images seront utilisées pour la vérification faciale.
            </Text>
            <FormControl isRequired>
              <FormLabel>Photos des étudiants</FormLabel>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                p={1.5}
                accept="image/png, image/jpeg"
              />
            </FormControl>
            {files.length > 0 && (
              <VStack w="100%" align="start" spacing={1} mt={2}>
                <Text fontWeight="bold">Fichiers sélectionnés :</Text>
                <List spacing={2}>
                  {files.map((file, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FaFileImage} color="green.500" />
                      {file.name}
                    </ListItem>
                  ))}
                </List>
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isUploading}
            disabled={files.length === 0}
          >
            Enregistrer les signatures
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SignatureModal;
