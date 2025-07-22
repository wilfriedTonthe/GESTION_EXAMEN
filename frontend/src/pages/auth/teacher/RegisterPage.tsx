import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const TeacherRegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erreur',
        description: "Les mots de passe ne correspondent pas.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
      });

      toast({
        title: 'Compte créé.',
        description: "Votre compte a été créé avec succès.",
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      navigate('/teacher/login');
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Échec de l\'inscription.',
        description: err.message || "Une erreur inattendue s'est produite.",
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} maxWidth="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Heading>Inscription Enseignant</Heading>
          <FormControl isRequired>
            <FormLabel>Nom complet</FormLabel>
            <Input name="fullName" value={formData.fullName} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" name="email" value={formData.email} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Mot de passe</FormLabel>
            <Input type="password" name="password" value={formData.password} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Confirmer le mot de passe</FormLabel>
            <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            S'inscrire
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default TeacherRegisterPage;
