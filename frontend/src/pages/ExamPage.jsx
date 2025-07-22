import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Stack,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Badge
} from '@chakra-ui/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';
import examService, { submissionService } from '../services/examService';
import { ROUTES } from '../constants/routes';

const SecurityStatus = ({ status }) => {
  if (!status) {
    return <Badge colorScheme="gray">Surveillance en attente...</Badge>;
  }

  const { identity_confirmed, emotion, face_status } = status;

  if (face_status === 'not_detected') {
    return <Badge colorScheme="red">Visage non détecté</Badge>;
  }
  if (identity_confirmed) {
    return <Badge colorScheme="green">{`Identité confirmée (${emotion})`}</Badge>;
  }
  return <Badge colorScheme="orange">{`Identité non confirmée (${emotion})`}</Badge>;
};

SecurityStatus.propTypes = {
  status: PropTypes.shape({
    identity_confirmed: PropTypes.bool,
    emotion: PropTypes.string,
    face_status: PropTypes.string,
  }),
};

const QuestionCard = memo(function QuestionCard({ 
  question, 
  index, 
  totalQuestions, 
  onAnswerChange, 
  selectedAnswers 
}) {
  const handleRadioChange = (value) => {
    onAnswerChange(question.id, [value]);
  };

  const handleCheckboxChange = (values) => {
    onAnswerChange(question.id, values);
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" w="100%">
      <VStack align="flex-start" spacing={4}>
        <HStack justify="space-between" w="100%">
          <Heading as="h2" size="md">Question {index + 1}</Heading>
          <Text fontSize="sm" color="gray.500">{totalQuestions} questions au total</Text>
        </HStack>
        <Text fontSize="lg" fontWeight="medium">{question.text}</Text>
        
        {question.question_type === 'multiple_choice' && question.options && (
          <RadioGroup onChange={handleRadioChange} value={selectedAnswers[0] || ''}>
            <Stack direction="column">
              {question.options.map((option) => (
                <Radio key={option.id} value={option.id.toString()}>{option.text}</Radio>
              ))}
            </Stack>
          </RadioGroup>
        )}

        {question.question_type === 'multiple_answer' && question.options && (
          <CheckboxGroup onChange={handleCheckboxChange} value={selectedAnswers.map(String)}>
            <Stack direction="column">
              {question.options.map((option) => (
                <Checkbox key={option.id} value={option.id.toString()}>{option.text}</Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        )}
      </VStack>
    </Box>
  );
});

QuestionCard.propTypes = {
  question: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  selectedAnswers: PropTypes.array.isRequired,
};

const ExamLayout = ({ children }) => (
  <Box bg="gray.50" minH="100vh">
    {children}
  </Box>
);

ExamLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

function ExamPage() {
  // React Router and Chakra UI Hooks
  const { examPassword } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Component State
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [securitySessionId, setSecuritySessionId] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [securityActive, setSecurityActive] = useState(false);
  const [securityInitialized, setSecurityInitialized] = useState(false);

  // Refs
  const monitoringIntervalRef = useRef(null);
  const isMounted = useRef(true);
  const handleConfirmSubmitRef = useRef();

  // Constants and derived state
  const studentName = localStorage.getItem('examStudentName') || 'Étudiant Anonyme';

  // Effects
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initializeExamSecurity = useCallback(() => {
    if (exam?.id && studentName && !securityInitialized && !securityActive) {
      const sessionId = `${studentName}_${exam?.id}_${new Date().toISOString()}`;
      setSecuritySessionId(sessionId);
      
      submissionService.startExamSecurity(sessionId)
        .then(status => {
          if (!isMounted.current) return;
          setSecurityActive(status?.active || false);
          setSecurityInitialized(true);
          toast({
            title: 'Sécurité de l\'examen activée',
            description: 'Les services de sécurité sont actifs.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        })
        .catch(err => {
          if (!isMounted.current) return;
          console.error('Erreur lors du démarrage des services de sécurité:', err);
          toast({
            title: 'Erreur de sécurité',
            description: err.message || 'Impossible de démarrer les services de sécurité.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
    }
  }, [exam, studentName, securityInitialized, securityActive, toast]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const examData = await examService.getExamByPassword(examPassword);
        if (isMounted.current) {
          setExam(examData);
          setQuestions(examData.questions || []);
          setTimeLeft(examData.duration * 60);
        }
      } catch (err) {
        if (isMounted.current) {
          setError('Impossible de charger l\'examen. Vérifiez le mot de passe et réessayez.');
        }
        console.error(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    if (examPassword) {
      fetchExam();
    }
  }, [examPassword]);

  useEffect(() => {
    if (exam) {
      initializeExamSecurity();
    }
  }, [exam, initializeExamSecurity]);

  const handleConfirmSubmit = useCallback(async () => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);
    try {
      const submissionData = {
        exam_id: exam.id,
        student_name: studentName,
        answers: Object.entries(answers).map(([question_id, option_ids]) => ({ question_id: parseInt(question_id), option_ids: option_ids.map(id => parseInt(id)) })),
      };
      
      const result = await submissionService.submitExam(submissionData, studentPhoto);
      
      toast({
        title: 'Examen soumis avec succès!',
        description: `Votre score est de ${result.score}/${result.total_score}`,
        status: 'success',
        duration: null,
        isClosable: true,
      });

      navigate(ROUTES.HOME);
    } catch (err) {
      toast({
        title: 'Erreur lors de la soumission',
        description: err.message || 'Une erreur est survenue.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
        onClose();
      }
    }
  }, [isSubmitting, exam, studentName, answers, studentPhoto, toast, navigate, onClose]);

  useEffect(() => {
    handleConfirmSubmitRef.current = handleConfirmSubmit;
  });

  useEffect(() => {
    if (timeLeft === 0) {
      handleConfirmSubmitRef.current();
    }
    if (!timeLeft || !isMounted.current) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  useEffect(() => {
    if (!securitySessionId || !securityActive || !exam?.id) return;

    const startMonitoring = async () => {
      try {
        await examService.startMonitoring(exam.id, studentName, securitySessionId);
      } catch (error) {
        if (isMounted.current) {
          console.error('Failed to start monitoring:', error);
          toast({
            title: 'Erreur de surveillance',
            description: 'Impossible de démarrer la surveillance faciale.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    startMonitoring();

    return () => {
      if (exam?.id && securitySessionId) {
        examService.stopMonitoring(exam.id, securitySessionId).catch(err => {
          console.error('Failed to stop monitoring on cleanup:', err);
        });
      }
    };
  }, [securitySessionId, securityActive, exam?.id, studentName, toast]);

  useEffect(() => {
    if (securityActive && securitySessionId && exam?.id) {
      monitoringIntervalRef.current = setInterval(async () => {
        try {
          const status = await examService.getMonitoringStatus(exam.id, securitySessionId);
          if (isMounted.current) {
            setMonitoringStatus(status);
          }
        } catch (error) {
          if (isMounted.current) {
            console.error('Failed to get monitoring status:', error);
            clearInterval(monitoringIntervalRef.current);
          }
        }
      }, 5000); // Poll every 5 seconds
    } else if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
    }

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [securityActive, securitySessionId, exam?.id]);

  const handleAnswerChange = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const questionProgress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handlePhotoChange = useCallback((e) => {
    if (e.target.files?.[0]) {
      setStudentPhoto(e.target.files[0]);
    }
  }, []);

  if (loading) {
    return (
      <ExamLayout>
        <Container maxW="container.md" py={10} centerContent>
          <Text>Chargement de l'examen...</Text>
        </Container>
      </ExamLayout>
    );
  }

  if (error) {
    return (
      <ExamLayout>
        <Container maxW="container.md" py={10}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button mt={4} colorScheme="blue" onClick={() => navigate(ROUTES.HOME)}>
            Retour à l'accueil
          </Button>
        </Container>
      </ExamLayout>
    );
  }

  if (!exam || !currentQuestion) {
    return (
      <ExamLayout>
        <Container maxW="container.md" py={10}>
          <Text>Aucun examen trouvé ou les questions n'ont pu être chargées.</Text>
          <Button mt={4} colorScheme="blue" onClick={() => navigate(ROUTES.HOME)}>
            Retour à l'accueil
          </Button>
        </Container>
      </ExamLayout>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
       <Container maxW="container.xl" px={0}>
        <VStack spacing={8} align="stretch">
          <Box bg="white" shadow="md" borderRadius="lg" p={6}>
            <HStack justifyContent="space-between">
              <Box>
                <Heading as="h1" size="lg">{exam.title}</Heading>
                <Text color="gray.600">Bonjour, {studentName}</Text>
              </Box>
              <HStack spacing={4}>
                <Text fontWeight="bold" fontSize="lg">Temps restant: {formatTime(timeLeft)}</Text>
                <SecurityStatus status={monitoringStatus} />
              </HStack>
            </HStack>
          </Box>

          <Progress value={questionProgress} size="sm" colorScheme="blue" />

          <QuestionCard 
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentQuestionIndex}
            totalQuestions={questions.length}
            onAnswerChange={handleAnswerChange}
            selectedAnswers={answers[currentQuestion.id] || []}
          />

          <HStack justifyContent="space-between">
            <Button 
              leftIcon={<FaArrowLeft />} 
              onClick={goToPreviousQuestion} 
              isDisabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>
            <Button 
              rightIcon={<FaArrowRight />} 
              onClick={goToNextQuestion} 
              isDisabled={currentQuestionIndex === questions.length - 1}
            >
              Suivant
            </Button>
          </HStack>

          <Button 
            colorScheme="green" 
            size="lg" 
            leftIcon={<FaCheck />} 
            onClick={onOpen}
            isDisabled={isSubmitting}
          >
            Soumettre l'examen
          </Button>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmation de la soumission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Veuillez téléverser une photo de vous pour vérification avant de soumettre.</Text>
              <FormControl isRequired>
                <FormLabel>Photo de vérification</FormLabel>
                <Input type="file" accept="image/*" onChange={handlePhotoChange} p={1} />
                <FormHelperText>Cette photo sera utilisée pour confirmer votre identité.</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleConfirmSubmit} 
              isLoading={isSubmitting}
              isDisabled={!studentPhoto}
            >
              Confirmer et Soumettre
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ExamPage;
