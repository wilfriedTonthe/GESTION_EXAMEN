import React from 'react';
import { Flex, Box, Button, Heading, Spacer, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { ROUTES } from '../constants/routes';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const navigate = useNavigate();

  return (
    <Box 
      as="header" 
      bg={bg} 
      px={4} 
      py={3} 
      boxShadow="sm" 
      position="sticky" 
      top={0} 
      zIndex={10}
    >
      <Flex maxW="1200px" mx="auto" align="center">
        <Heading 
          as={RouterLink} 
          to={ROUTES.HOME} 
          size="lg" 
          fontWeight="bold"
          color="brand.600"
          _hover={{ textDecoration: 'none', opacity: 0.8 }}
        >
          QuizMaster
        </Heading>
        
        <Spacer />
        
        <Flex align="center" gap={4}>
          <Button 
            as={RouterLink} 
            to={ROUTES.HOME} 
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
          >
            Accueil
          </Button>
          
          <Button 
            as={RouterLink} 
            to={ROUTES.TEACHER}
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
          >
            Espace Enseignant
          </Button>
          
          <Button 
            onClick={toggleColorMode} 
            size="md"
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
          >
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
          
          <Button 
            as={RouterLink}
            to={ROUTES.EXAM_ACCESS}
            colorScheme="brand"
          >
            Passer un examen
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
