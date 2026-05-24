import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LandingNav from '@/components/home/LandingNav';
import HeroSection from '@/components/home/HeroSection';
import LiveCityPulse from '@/components/home/LiveCityPulse';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorks from '@/components/home/HowItWorks';
import ImpactStats from '@/components/home/ImpactStats';
import SuccessStories from '@/components/home/SuccessStories';
import ArticlesSection from '@/components/home/ArticlesSection';
import CivicImpactSection from '@/components/home/CivicImpactSection';
import LeaderboardTeaser from '@/components/home/LeaderboardTeaser';
import ForGovernment from '@/components/home/ForGovernment';
import CTASection from '@/components/home/CTASection';
import Footer from '@/components/home/Footer';
import SignInModal from '@/components/auth/SignInModal';
import SignUpModal from '@/components/auth/SignUpModal';

const Index = () => {
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const openSignIn = () => {
    setSignUpOpen(false);
    setSignInOpen(true);
  };

  const openSignUp = () => {
    setSignInOpen(false);
    setSignUpOpen(true);
  };

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (searchParams.get('signin') === '1') {
      setSignUpOpen(false);
      setSignInOpen(true);
      next.delete('signin');
      changed = true;
    }
    if (searchParams.get('signup') === '1') {
      setSignInOpen(false);
      setSignUpOpen(true);
      next.delete('signup');
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav onSignIn={openSignIn} onSignUp={openSignUp} />
      <HeroSection onSignIn={openSignIn} onSignUp={openSignUp} />
      <LiveCityPulse onSignUp={openSignUp} />
      <HowItWorks />
      <FeaturesSection />
      <ImpactStats />
      <SuccessStories />
      <LeaderboardTeaser />
      <ArticlesSection />
      <CivicImpactSection />
      <ForGovernment onSignIn={openSignIn} />
      <CTASection onSignUp={openSignUp} />
      <Footer />
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} onSignUp={openSignUp} />
      <SignUpModal open={signUpOpen} onOpenChange={setSignUpOpen} onSignIn={openSignIn} />
    </div>
  );
};

export default Index;
