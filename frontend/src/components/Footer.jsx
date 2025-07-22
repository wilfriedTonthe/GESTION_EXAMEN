import React from 'react';
import { Box, Flex, Text, Link, useColorModeValue } from '@chakra-ui/react';

const Footer = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box 
      as="footer" 
      bg={bg} 
      borderTop="1px" 
      borderColor={borderColor}
      py={6}
      mt={12}
    >
      <Box maxW="1200px" mx="auto" px={4}>
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align="center"
          gap={4}
        >
          <Text fontSize="sm" color="gray.500">
            © {new Date().getFullYear()} QuizMaster. Tous droits réservés.
          </Text>
          
          <Flex gap={6}>
            <Link 
              href="#" 
              fontSize="sm" 
              color="gray.500" 
              _hover={{ color: 'brand.500', textDecoration: 'none' }}
            >
              Conditions d'utilisation
            </Link>
            <Link 
              href="#" 
              fontSize="sm" 
              color="gray.500" 
              _hover={{ color: 'brand.500', textDecoration: 'none' }}
            >
              Politique de confidentialité
            </Link>
            <Link 
              href="#" 
              fontSize="sm" 
              color="gray.500" 
              _hover={{ color: 'brand.500', textDecoration: 'none' }}
            >
              Contact
            </Link>
          </Flex>
        </Flex>
        
        <Text mt={4} fontSize="xs" color="gray.400" textAlign="center">
          Développé avec React, FastAPI et SQLite
        </Text>
      </Box>
    </Box>
  );
};

export default Footer;
