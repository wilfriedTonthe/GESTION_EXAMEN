import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorMode,
  useColorModeValue,
  useBreakpointValue
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaChartBar,
  FaFilePdf,
  FaSun,
  FaMoon,
  FaUserPlus,
  FaSignInAlt
} from 'react-icons/fa';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';

const FeatureCard = ({ icon, title, description }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={cardBorder}
      bg={cardBg}
      boxShadow="sm"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      transition="all 0.2s"
      h="100%"
    >
      <VStack spacing={4} align="start">
        <Flex
          w={12}
          h={12}
          align="center"
          justify="center"
          bg="brand.100"
          color="brand.600"
          borderRadius="lg"
          fontSize="xl"
        >
          {icon}
        </Flex>
        <Heading as="h3" size="md">{title}</Heading>
        <Text color={useColorModeValue('gray.600', 'gray.300')}>
          {description}
        </Text>
      </VStack>
    </Box>
  );
};

const HomePage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const heroBg = useColorModeValue('brand.50', 'brand.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const { isAuthenticated, logout } = useAuth?.() || {};
  const navigate = useNavigate();

  return (
    <Box>
      {/* Header */}
      <Box 
        as="header" 
        bg={useColorModeValue('white', 'gray.800')} 
        px={4} 
        py={3} 
        boxShadow="sm" 
        position="sticky" 
        top={0} 
        zIndex={10}
      >
        <Flex maxW="1200px" mx="auto" align="center" justify="space-between">
          <Heading as={RouterLink} to={ROUTES.HOME} size="lg" fontWeight="bold" color="brand.600" _hover={{ textDecoration: 'none', opacity: 0.8 }}>
            QuizMaster
          </Heading>

          <HStack spacing={4}>
            <Button
              onClick={toggleColorMode}
              variant="ghost"
              size={isMobile ? 'sm' : 'md'}
              aria-label="Toggle color mode"
            >
              {colorMode === 'light' ? <FaMoon /> : <FaSun />}
            </Button>

            <Button as={RouterLink} to={ROUTES.HOME} variant="ghost">
              Accueil
            </Button>

            <Button as={RouterLink} to={ROUTES.TEACHER} variant="ghost">
              Espace Enseignant
            </Button>

            <Button as={RouterLink} to={ROUTES.EXAM_ACCESS} colorScheme="brand">
              Passer un examen
            </Button>

            {isAuthenticated ? (
              <>
                <Button as={RouterLink} to="/dashboard" colorScheme="brand" leftIcon={<FaChalkboardTeacher />}>
                  Tableau de bord
                </Button>
                <Button onClick={() => { logout?.(); navigate('/'); }} variant="outline">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button as={RouterLink} to="/teacher/login" variant="outline" leftIcon={<FaSignInAlt />}>
                  Connexion
                </Button>
                <Button as={RouterLink} to="/teacher/register" colorScheme="brand" leftIcon={<FaUserPlus />}>
                  S'inscrire
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Hero Section */}
      <Box bg={heroBg} py={20} borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', md: 'row' }} align="center">
            <Box flex={1} pr={{ base: 0, md: 12 }} mb={{ base: 10, md: 0 }}>
              <Heading as="h1" size="2xl" mb={6} lineHeight="1.2">
                Plateforme d'évaluation en ligne <Box as="span" color="brand.500">simple et efficace</Box>
              </Heading>
              <Text fontSize="xl" mb={8} color={useColorModeValue('gray.600', 'gray.300')}>
                Créez, gérez et passez des examens en ligne en toute simplicité. Obtenez des résultats instantanés et des analyses détaillées.
              </Text>
              <HStack spacing={4}>
                <Button as={RouterLink} to={ROUTES.TEACHER} size="lg" colorScheme="brand" rightIcon={<Icon as={FaChalkboardTeacher} />}>
                  Espace Enseignant
                </Button>
                <Button as={RouterLink} to={ROUTES.EXAM.replace(':password', '')} size="lg" variant="outline" rightIcon={<Icon as={FaClipboardCheck} />}>
                  Passer un examen
                </Button>
              </HStack>
            </Box>

            <Box flex={1}>
              <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="lg" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
                <Text fontSize="lg" fontWeight="bold" mb={4}>Comment ça marche ?</Text>
                <VStack spacing={4} align="stretch">
                  {[
                    { step: '1', title: 'Créez un examen', description: 'Ajoutez des questions et définissez les bonnes réponses.' },
                    { step: '2', title: 'Partagez le mot de passe', description: 'Les étudiants peuvent accéder à l\'examen avec le mot de passe fourni.' },
                    { step: '3', title: 'Consultez les résultats', description: 'Visualisez les résultats en temps réel et exportez-les en PDF.' },
                  ].map((item) => (
                    <HStack key={item.step} align="start" spacing={4}>
                      <Flex align="center" justify="center" w={8} h={8} borderRadius="full" bg="brand.500" color="white" flexShrink={0} mt={1}>
                        {item.step}
                      </Flex>
                      <Box>
                        <Text fontWeight="bold">{item.title}</Text>
                        <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">{item.description}</Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20}>
        <VStack spacing={16}>
          <Box textAlign="center" maxW="3xl" mx="auto">
            <Text color="brand.500" fontWeight="semibold" mb={3}>FONCTIONNALITÉS</Text>
            <Heading as="h2" size="xl" mb={6}>Une solution complète pour vos évaluations</Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.300')}>
              Découvrez comment notre plateforme peut simplifier la gestion de vos examens et évaluations.
            </Text>
          </Box>
          <Box w="100%">
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
              <FeatureCard icon={<FaChalkboardTeacher />} title="Création facile" description="Créez des examens en quelques clics avec notre interface intuitive." />
              <FeatureCard icon={<FaClipboardCheck />} title="Correction automatique" description="Les réponses sont corrigées automatiquement, avec une note immédiate." />
              <FeatureCard icon={<FaChartBar />} title="Analyses détaillées" description="Visualisez les statistiques de performance des étudiants." />
              <FeatureCard icon={<FaFilePdf />} title="Export PDF" description="Téléchargez les résultats au format PDF pour les archiver ou les imprimer." />
            </Box>
          </Box>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW="container.lg" textAlign="center">
          <Heading as="h2" size="xl" mb={6}>Prêt à commencer ?</Heading>
          <Text fontSize="lg" mb={8} maxW="2xl" mx="auto" color={useColorModeValue('gray.600', 'gray.300')}>
            Rejoignez des milliers d'enseignants qui utilisent déjà notre plateforme pour gérer leurs évaluations.
          </Text>
          <Button as={RouterLink} to={ROUTES.TEACHER} size="lg" colorScheme="brand" rightIcon={<Icon as={FaChalkboardTeacher} />}>
            Créer un examen maintenant
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
