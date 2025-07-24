import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { examService } from '../services/api';
import { ROUTES } from "../constants/routes";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Text,
  useDisclosure,
  useToast,
  VStack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  ChevronDownIcon, 
  ExternalLinkIcon, 
  SearchIcon, 
  CopyIcon, 
  EditIcon, 
  DeleteIcon, 
  ViewIcon, 
  DownloadIcon 
} from '@chakra-ui/icons';
import { FaClipboardList, FaUsers, FaFilePdf, FaChalkboardTeacher, FaSignature } from 'react-icons/fa';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AddQuestionsModal from '../components/AddQuestionsModal';
import SignatureModal from '../components/SignatureModal';

// Schéma de validation pour le formulaire de création d'examen
const ExamSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .required('Le titre est obligatoire'),
  description: Yup.string().trim(),
  duration_minutes: Yup.number()
    .min(1, 'La durée doit être d\'au moins 1 minute')
    .required('La durée est obligatoire'),
});

const CreateExamModal = ({ isOpen, onClose, onExamCreated }) => {
  const initialRef = React.useRef(null);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      isCentered
      initialFocusRef={initialRef}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx={4}>
        <Formik
          initialValues={{
            title: '',
            description: '',
            duration_minutes: 30,
          }}
          validationSchema={ExamSchema}
          onSubmit={onExamCreated} // On délègue la soumission au parent
          enableReinitialize
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <ModalHeader>Créer un nouvel examen</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <Field name="title">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.title && form.touched.title} isRequired>
                        <FormLabel>Titre de l'examen</FormLabel>
                        <Input {...field} ref={initialRef} placeholder="Ex: Examen de mi-session" />
                        <FormErrorMessage>{form.errors.title}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <Field name="description">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.description && form.touched.description}>
                        <FormLabel>Description</FormLabel>
                        <Textarea {...field} placeholder="Brève description de l'examen" />
                        <FormErrorMessage>{form.errors.description}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>

                  <Field name="duration_minutes">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.duration_minutes && form.touched.duration_minutes} isRequired>
                        <FormLabel>Durée (en minutes)</FormLabel>
                        <NumberInput {...field} min={1} onChange={(val) => form.setFieldValue(field.name, parseInt(val, 10))}>
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormErrorMessage>{form.errors.duration_minutes}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button onClick={onClose} mr={3} variant="ghost">Annuler</Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={isSubmitting}
                  leftIcon={<AddIcon />}
                >
                  Créer l'examen
                </Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};

const EditExamModal = ({ isOpen, onClose, exam, onExamUpdated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (exam) {
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setDuration(exam.duration_minutes || 30);
      setIsActive(exam.is_active || true);
    }
  }, [exam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const updatedData = { title, description, duration_minutes: duration, is_active: isActive };
      const updatedExam = await examService.updateExam(exam.id, updatedData);
      toast({ title: 'Succès', description: 'Examen mis à jour.', status: 'success' });
      onExamUpdated(updatedExam);
      onClose();
    } catch (err) {
      setError('Erreur lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Modifier l'examen</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Durée (minutes)</FormLabel>
                <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} />
              </FormControl>
              <FormControl>
                <FormLabel>Statut</FormLabel>
                <Select value={isActive} onChange={(e) => setIsActive(e.target.value === 'true')}>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>Sauvegarder</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const ExamCard = ({ exam, onDelete, onEdit, onAddQuestions, onManageSignatures }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardStyle = {
    bg: useColorModeValue('white', 'gray.700'),
    border: '1px solid',
    borderColor: borderColor,
    borderRadius: 'lg',
    overflow: 'hidden',
    _hover: { shadow: 'md' },
    transition: 'all 0.2s',
  };
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(exam.password);
    toast({
      title: 'Mot de passe copié',
      description: 'Le mot de passe a été copié dans le presse-papier.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  return (
    <Card 
      variant="outline" 
      borderWidth="1px" 
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      transition="all 0.2s"
      h="100%"
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Heading size="md" mb={1}>{exam.title}</Heading>
            <Badge colorScheme={exam.is_active ? 'green' : 'gray'}>
              {exam.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </Box>
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<ChevronDownIcon />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem 
                icon={<EditIcon />} 
                onClick={() => onEdit(exam)}
              >
                Modifier
              </MenuItem>
              <MenuItem 
                icon={<CopyIcon />} 
                onClick={handleCopyPassword}
              >
                Copier le mot de passe
              </MenuItem>
              <MenuItem 
                icon={<ViewIcon />} 
                onClick={() => navigate(ROUTES.EXAM_RESULTS.replace(':examId', exam.id))}
              >
                Voir les résultats
              </MenuItem>
              <MenuItem 
                icon={<DownloadIcon />} 
                onClick={() => examService.downloadResultsPdf(exam.id)}
              >
                Exporter en PDF
              </MenuItem>
              <MenuItem 
                icon={<FaSignature />} 
                onClick={() => onManageSignatures(exam)}
              >
                Gérer les signatures
              </MenuItem>
              <MenuItem 
                icon={<DeleteIcon />} 
                color="red.500"
                onClick={() => onDelete(exam.id)}
              >
                Supprimer
              </MenuItem>
              <MenuItem 
                icon={<AddIcon />} 
                onClick={() => onAddQuestions(exam.id)}
              >
                Ajouter des questions
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </CardHeader>
      
      <CardBody pt={2} pb={4}>
        <Text color="gray.600" fontSize="sm" noOfLines={2} mb={4}>
          {exam.description || 'Aucune description fournie'}
        </Text>
        
        <VStack align="stretch" spacing={2} fontSize="sm">
          <HStack>
            <Box as="span" color="gray.500" w="120px">Mot de passe:</Box>
            <Box fontFamily="mono" fontWeight="medium">{exam.password}</Box>
            <IconButton
              icon={<CopyIcon />}
              size="xs"
              variant="ghost"
              onClick={handleCopyPassword}
              aria-label="Copier le mot de passe"
            />
          </HStack>
          
          <HStack>
            <Box as="span" color="gray.500" w="120px">Créé le:</Box>
            <Box>{new Date(exam.created_at).toLocaleDateString()}</Box>
          </HStack>
          
          {exam.duration_minutes && (
            <HStack>
              <Box as="span" color="gray.500" w="120px">Durée:</Box>
              <Box>{exam.duration_minutes} minutes</Box>
            </HStack>
          )}
          
          <HStack>
            <Box as="span" color="gray.500" w="120px">Questions:</Box>
            <Box>{exam.questions_count || 0}</Box>
          </HStack>
          
          <HStack>
            <Box as="span" color="gray.500" w="120px">Soumissions:</Box>
            <Box>{exam.submissions_count || 0}</Box>
          </HStack>
        </VStack>
      </CardBody>
      
      <CardFooter pt={0} borderTopWidth="1px" borderColor={borderColor}>
        <Button
          size="sm"
          colorScheme="blue"
          variant="outline"
          w="100%"
          onClick={() => navigate(`${ROUTES.EXAM_RESULTS.replace(':examId', exam.id)}`)}
          rightIcon={<ExternalLinkIcon />}
        >
          Voir les résultats
        </Button>
      </CardFooter>
    </Card>
  );
};

const TeacherDashboardPage = () => {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExamForSignature, setSelectedExamForSignature] = useState(null);
  
  const {
    isOpen: isQuestionsModalOpen,
    onOpen: onQuestionsModalOpen,
    onClose: onQuestionsModalClose,
  } = useDisclosure();
  
  const { 
    isOpen: isCreateModalOpen, 
    onOpen: onCreateModalOpen, 
    onClose: onCreateModalClose 
  } = useDisclosure();

  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isSignatureModalOpen, 
    onOpen: onSignatureModalOpen, 
    onClose: onSignatureModalClose 
  } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();
  const bg = useColorModeValue('gray.50', 'gray.900');
  
  // Charger les examens
  useEffect(() => {
    let isMounted = true;
    
    const loadExams = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Utilisation du service API pour charger les examens
        const data = await examService.getExams();
        
        if (isMounted) {
          setExams(data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des examens:', err);
        if (isMounted) {
          setError('Impossible de charger les examens. Veuillez réessayer.');
          
          // Si l'erreur est une erreur d'authentification, le message est plus spécifique
          if (err.message === 'Not authenticated') {
            setError('Votre session a expiré. Veuillez vous reconnecter.');
            // Redirection gérée par l'intercepteur
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadExams();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
    const handleCreateExam = async (newExam, { setSubmitting, resetForm }) => {
    try {
      const createdExam = await examService.createExam(newExam);
      setExams(prevExams => [createdExam, ...prevExams]);

      toast({
        title: 'Examen créé',
        description: `L'examen "${createdExam.title}" a été créé avec succès.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      resetForm();
      onExamModalClose(); // Fermer la modale de création

      // Ouvrir directement le modal pour ajouter des questions
      setSelectedExamId(createdExam.id);
      onQuestionsModalOpen();

    } catch (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      const errorMessage = error.response?.data?.detail || 'Une erreur est survenue lors de la création de l\'examen.';
      
      toast({
        title: 'Erreur de création',
        description: errorMessage,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleExamUpdated = (updatedExam) => {
    setExams(prevExams => prevExams.map(exam => exam.id === updatedExam.id ? updatedExam : exam));
  };

  const handleDeleteExam = async (examId) => {
    // Affiche une fenêtre de confirmation
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ? Cette action est irréversible.')) {
      try {
        // Appelle le service pour supprimer l'examen
        await examService.deleteExam(examId);
        
        // Met à jour l'état en retirant l'examen supprimé (méthode sécurisée)
        setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
        
        toast({
          title: 'Examen supprimé',
          description: "L'examen a été retiré de votre tableau de bord.",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'examen:', err);
        toast({
          title: 'Erreur de suppression',
          description: 'Une erreur est survenue. Veuillez réessayer.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    onEditModalOpen();
  };

  const handleAddQuestions = (examId) => {
    setSelectedExamId(examId);
    onQuestionsModalOpen();
  };

  const handleManageSignatures = (exam) => {
    setSelectedExamForSignature(exam);
    onSignatureModalOpen();
  };
  
  // Charger les examens au montage du composant
  useEffect(() => {
    const loadExams = async () => {
      try {
        setIsLoading(true);
        const examsData = await examService.getExams();
        setExams(Array.isArray(examsData) ? examsData : []);
      } catch (err) {
        console.error('Erreur lors du chargement des examens:', err);
        setError('Impossible de charger les examens. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExams();
  }, []);

  const handleQuestionsAdded = async () => {
    try {
      console.log('Mise à jour de la liste des examens après ajout de questions...');
      
      // Afficher un indicateur de chargement
      const toastId = toast({
        title: 'Mise à jour en cours',
        description: 'Actualisation de la liste des examens...',
        status: 'info',
        duration: null, // Ne pas fermer automatiquement
        isClosable: false,
      });
      
      try {
        // Recharger la liste des examens pour mettre à jour le nombre de questions
        const updatedExams = await examService.getExams();
        
        // Mettre à jour l'état avec les nouveaux examens
        setExams(Array.isArray(updatedExams) ? updatedExams : []);
        
        // Mettre à jour la notification pour indiquer le succès
        toast.update(toastId, {
          title: 'Succès',
          description: 'La liste des examens a été mise à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        console.log('Liste des examens mise à jour avec succès');
      } catch (error) {
        console.error('Erreur lors du rechargement des examens:', error);
        
        // Mettre à jour la notification pour afficher l'erreur
        toast.update(toastId, {
          title: 'Avertissement',
          description: 'La liste des examens n\'a pas pu être actualisée. Veuillez recharger la page.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Fermer le modal après un court délai pour laisser le temps à l'utilisateur de voir le message
      setTimeout(() => {
        onQuestionsModalClose();
      }, 500);
      
    } catch (error) {
      console.error('Erreur inattendue dans handleQuestionsAdded:', error);
      
      toast({
        title: 'Erreur inattendue',
        description: 'Une erreur inattendue est survenue. Veuillez réessayer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const filteredExams = exams.filter(exam => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = exam.title.toLowerCase().includes(searchLower) ||
                        (exam.description && exam.description.toLowerCase().includes(searchLower));
    
    if (selectedStatus === 'all') return matchesSearch;
    if (selectedStatus === 'active') return matchesSearch && exam.is_active;
    if (selectedStatus === 'inactive') return matchesSearch && !exam.is_active;
    return false;
  });

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pb={12}>
      <Box bg="blue.600" color="white" py={8} mb={8}>
        <Container maxW="container.xl">
          <HStack spacing={4} align="center">
            <Box as={FaChalkboardTeacher} boxSize={8} />
            <Box>
              <Heading size="lg">Tableau de bord enseignant</Heading>
              <Text>Gérez vos examens et consultez les résultats</Text>
            </Box>
          </HStack>
        </Container>
      </Box>
      
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Statistiques */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Card bg="white" borderRadius="lg" boxShadow="sm">
              <CardBody>
                <HStack>
                  <Box p={3} bg="blue.100" borderRadius="full" color="blue.600">
                    <FaClipboardList size={24} />
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Examens créés</Text>
                    <Heading size="lg">{exams.length}</Heading>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            
            <Card bg="white" borderRadius="lg" boxShadow="sm">
              <CardBody>
                <HStack>
                  <Box p={3} bg="green.100" borderRadius="full" color="green.600">
                    <FaUsers size={24} />
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Participants totaux</Text>
                    <Heading size="lg">
                      {exams.reduce((sum, exam) => sum + (exam.submissions_count || 0), 0)}
                    </Heading>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            
            <Card bg="white" borderRadius="lg" boxShadow="sm">
              <CardBody>
                <HStack>
                  <Box p={3} bg="purple.100" borderRadius="full" color="purple.600">
                    <FaFilePdf size={24} />
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Rapports générés</Text>
                    <Heading size="lg">12</Heading>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          {/* En-tête avec bouton de création et recherche */}
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" mb={6}>
            <Heading size="lg" mb={{ base: 4, md: 0 }}>Mes examens</Heading>
            
            <HStack spacing={4} w={{ base: '100%', md: 'auto' }}>
              <InputGroup w={{ base: '100%', md: '250px' }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Rechercher un examen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                />
              </InputGroup>
              
              <Select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                bg="white"
                w={{ base: '100%', md: '200px' }}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </Select>
              
              <Button 
                colorScheme="blue" 
                leftIcon={<AddIcon />}
                onClick={onCreateModalOpen}
                w={{ base: '100%', md: 'auto' }}
              >
                Nouvel examen
              </Button>
            </HStack>
          </Flex>
          
          {/* Liste des examens */}
          {isLoading ? (
            <Box textAlign="center" py={12}>
              <Text>Chargement des examens...</Text>
            </Box>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredExams.length === 0 ? (
            <Box textAlign="center" py={12} bg="white" borderRadius="lg" p={8} boxShadow="sm">
              <Text fontSize="xl" color="gray.500" mb={4}>
                {searchTerm ? 'Aucun examen ne correspond à votre recherche' : 'Aucun examen créé pour le moment'}
              </Text>
              <Button 
                colorScheme="blue" 
                leftIcon={<AddIcon />}
                onClick={onCreateModalOpen}
              >
                Créer votre premier examen
              </Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredExams.map((exam) => (
                <ExamCard 
                  key={exam.id} 
                  exam={exam} 
                  onDelete={handleDeleteExam} 
                  onEdit={handleEditExam}
                  onAddQuestions={handleAddQuestions}
                  onManageSignatures={handleManageSignatures}
                />
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
      
      {/* Modal de création d'examen */}
      <CreateExamModal 
        isOpen={isCreateModalOpen} 
        onClose={onCreateModalClose} 
        onExamCreated={handleCreateExam} 
      />
      
      {editingExam && (
        <EditExamModal 
          isOpen={isEditModalOpen} 
          onClose={onEditModalClose} 
          exam={editingExam} 
          onExamUpdated={handleExamUpdated}
        />
      )}

      <AddQuestionsModal
        isOpen={isQuestionsModalOpen}
        onClose={onQuestionsModalClose}
        examId={selectedExamId}
        onQuestionsAdded={handleQuestionsAdded}
      />
      
      {selectedExamForSignature && (
        <SignatureModal 
          isOpen={isSignatureModalOpen} 
          onClose={onSignatureModalClose} 
          exam={selectedExamForSignature} 
        />
      )}
    </Box>
  );
};

// Validation des props avec PropTypes
CreateExamModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExamCreated: PropTypes.func.isRequired,
};

ExamCard.propTypes = {
  exam: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    password: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    is_active: PropTypes.bool.isRequired,
    duration_minutes: PropTypes.number,
    questions_count: PropTypes.number,
    submissions_count: PropTypes.number,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onAddQuestions: PropTypes.func.isRequired,
  onManageSignatures: PropTypes.func.isRequired,
};

export default TeacherDashboardPage;
