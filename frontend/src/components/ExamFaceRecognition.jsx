import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import FaceRecognitionUploader from './FaceRecognitionUploader';

/**
 * Composant pour gérer la reconnaissance faciale d'un examen
 * Ce composant est utilisé dans la page de l'enseignant pour configurer
 * la reconnaissance faciale pour un examen spécifique
 */
const ExamFaceRecognition = ({ examId, examTitle }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleOpenModal = () => {
    onOpen();
  };

  return (
    <>
      <Button
        leftIcon={<AttachmentIcon />}
        colorScheme="purple"
        variant="outline"
        onClick={handleOpenModal}
        size="sm"
      >
        Configurer Reconnaissance Faciale
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reconnaissance Faciale - {examTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Configurez la reconnaissance faciale pour cet examen en téléversant des photos des étudiants autorisés.
              Les noms des fichiers doivent correspondre aux noms complets des étudiants.
            </Text>
            
            <Accordion allowToggle defaultIndex={[0]}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      Étape 1: Téléverser les images des étudiants
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <FaceRecognitionUploader examId={examId} />
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      Étape 2: Instructions pour les étudiants
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Text>
                    Informez les étudiants qu'ils devront:
                  </Text>
                  <Box pl={4} mt={2}>
                    <Text>• Autoriser l'accès à leur caméra</Text>
                    <Text>• Rester visibles pendant toute la durée de l'examen</Text>
                    <Text>• S'assurer d'avoir un bon éclairage</Text>
                    <Text>• Éviter de porter des lunettes de soleil ou des masques qui couvrent le visage</Text>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

ExamFaceRecognition.propTypes = {
  examId: PropTypes.string.isRequired,
  examTitle: PropTypes.string.isRequired
};

export default ExamFaceRecognition;
