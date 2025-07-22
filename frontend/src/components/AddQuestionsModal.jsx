import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, VStack, HStack, FormControl, FormLabel, Input, Textarea, Select,
  IconButton, useToast, Box, Divider, Text
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { examService } from '../services/api';

const QuestionTypes = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
};

const initialQuestionState = {
  question_text: '',
  question_type: QuestionTypes.MULTIPLE_CHOICE,
  points: 1,
  options: [
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ],
};

export const AddQuestionsModal = ({ isOpen, onClose, examId, onQuestionsAdded }) => {
  const [questions, setQuestions] = useState([{ ...initialQuestionState }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleAddQuestion = () => {
    setQuestions([...questions, { ...initialQuestionState }]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    if (field === 'question_type') {
      newQuestions[index].options = value === QuestionTypes.TRUE_FALSE
        ? [
            { option_text: 'Vrai', is_correct: false },
            { option_text: 'Faux', is_correct: false }
          ]
        : [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
          ];
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = {
      ...newQuestions[qIndex].options[oIndex],
      [field]: field === 'is_correct' ? value === 'true' || value === true : value,
    };
    setQuestions(newQuestions);
  };

  const handleAddOption = (qIndex) => {
    if (questions[qIndex].options.length < 5) {
      const newQuestions = [...questions];
      newQuestions[qIndex].options.push({ option_text: '', is_correct: false });
      setQuestions(newQuestions);
    }
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    if (questions[qIndex].options.length > 2) {
      const newQuestions = [...questions];
      newQuestions[qIndex].options.splice(oIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validation des questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) throw new Error(`La question ${i + 1} est vide`);
        if (q.options.length < 2) throw new Error(`La question ${i + 1} doit avoir au moins 2 options`);
        if (!q.options.some(opt => opt.is_correct)) throw new Error(`La question ${i + 1} n'a pas de réponse correcte`);
        
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].option_text.trim()) {
            throw new Error(`Option ${j + 1} vide dans la question ${i + 1}`);
          }
        }
      }

      // Envoi des questions
      const promises = questions.map(question => 
        examService.addQuestion(examId, question)
      );
      await Promise.all(promises);

      // Réinitialisation et notification
      setQuestions([{ ...initialQuestionState }]);
      
      // Appeler le callback de mise à jour
      if (typeof onQuestionsAdded === 'function') {
        onQuestionsAdded();
      }
      
      // Afficher le toast
      toast({
        title: 'Succès',
        description: `Les ${questions.length} questions ont été ajoutées.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      
      // Fermer la modale après un court délai
      setTimeout(() => {
        onClose();
      }, 100);

    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur inconnue',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion sécurisée de la fermeture
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="2xl" 
      isCentered
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ajouter des questions</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {questions.map((q, qIndex) => (
              <Box key={qIndex} p={4} borderWidth="1px" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Question {qIndex + 1}</Text>
                  {questions.length > 1 && (
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      colorScheme="red"
                      aria-label="Supprimer"
                    />
                  )}
                </HStack>

                <VStack spacing={4} mt={2}>
                  <FormControl isRequired>
                    <FormLabel>Intitulé</FormLabel>
                    <Textarea
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                    />
                  </FormControl>

                  <HStack>
                    <FormControl>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                      >
                        <option value={QuestionTypes.MULTIPLE_CHOICE}>Choix multiple</option>
                        <option value={QuestionTypes.TRUE_FALSE}>Vrai / Faux</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Points</FormLabel>
                      <Input
                        type="number"
                        value={q.points}
                        min={1}
                        onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                  </HStack>

                  <Divider />

                  <Box>
                    <HStack justify="space-between">
                      <FormLabel>Options</FormLabel>
                      {q.question_type !== QuestionTypes.TRUE_FALSE && q.options.length < 5 && (
                        <Button onClick={() => handleAddOption(qIndex)} size="sm" leftIcon={<AddIcon />}>
                          Ajouter une option
                        </Button>
                      )}
                    </HStack>

                    <VStack spacing={2} mt={2}>
                      {q.options.map((opt, oIndex) => (
                        <HStack key={oIndex}>
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt.option_text}
                            onChange={(e) =>
                              handleOptionChange(qIndex, oIndex, 'option_text', e.target.value)
                            }
                            isDisabled={q.question_type === QuestionTypes.TRUE_FALSE}
                          />
                          <Select
                            width="130px"
                            value={opt.is_correct}
                            onChange={(e) =>
                              handleOptionChange(qIndex, oIndex, 'is_correct', e.target.value)
                            }
                          >
                            <option value={false}>Incorrect</option>
                            <option value={true}>Correct</option>
                          </Select>
                          {q.options.length > 2 && q.question_type !== QuestionTypes.TRUE_FALSE && (
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              onClick={() => handleRemoveOption(qIndex, oIndex)}
                              colorScheme="red"
                              aria-label="Supprimer option"
                            />
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              </Box>
            ))}

            <Button
              mt={4}
              leftIcon={<AddIcon />}
              onClick={handleAddQuestion}
              colorScheme="blue"
              variant="outline"
            >
              Ajouter une autre question
            </Button>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose} 
            isDisabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Enregistrement..."
          >
            Enregistrer les questions
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddQuestionsModal;