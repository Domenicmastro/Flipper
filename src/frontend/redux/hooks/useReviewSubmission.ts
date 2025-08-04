import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { addUserReview, selectCurrentUser } from '../slices/userSlice';
import type { ReviewScore } from '@/types';

interface ReviewSubmissionData {
  score: ReviewScore;
  comment: string;
  role: "buyer" | "seller";
}

interface UseReviewSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useReviewSubmission = (options?: UseReviewSubmissionOptions) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const toast = useToast();

  const submitReview = useCallback(async (
    targetUserId: string,
    reviewData: ReviewSubmissionData
  ) => {
    if (!currentUser) {
      const errorMsg = 'You must be logged in to submit a review';
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      options?.onError?.(errorMsg);
      return;
    }

    if (!reviewData.comment.trim()) {
      const errorMsg = 'Please provide a comment';
      toast({
        title: errorMsg,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      options?.onError?.(errorMsg);
      return;
    }

    try {
      await dispatch(addUserReview({
        userId: targetUserId,
        review: {
          id: crypto.randomUUID(),
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          reviewerImage: currentUser.image,
          score: reviewData.score,
          comment: reviewData.comment.trim(),
          role: reviewData.role,
          timestamp: new Date().toISOString(),
        },
      })).unwrap();

      toast({
        title: 'Review submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      options?.onSuccess?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit review';
      console.error('Failed to submit review:', error);
      
      toast({
        title: 'Error submitting review',
        description: errorMsg,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });

      options?.onError?.(errorMsg);
    }
  }, [dispatch, currentUser, toast, options]);

  return {
    submitReview,
    currentUser,
  };
};