
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Shield, Search } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      {/* Hero section */}
      <header className="container px-4 py-6 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary">Quluub</span>
        </div>
        <div>
          <Link to="/auth">
            <Button variant="outline" className="mr-2">Login</Button>
          </Link>
          <Link to="/auth">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="container px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Find your perfect match with faith at heart</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join the leading Muslim marriage app where compatibility meets faith
            </p>
            <Link to="/auth">
              <Button size="lg" className="rounded-full px-8">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </section>

        {/* Features section */}
        <section className="container px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compatible Matches</h3>
              <p className="text-muted-foreground">
                Our faith-focused matching system connects you with compatible Muslims who share your values and goals.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg border text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Guided Communication</h3>
              <p className="text-muted-foreground">
                Build meaningful connections through our Islamic-appropriate communication tools.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg border text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy & Security</h3>
              <p className="text-muted-foreground">
                Your information is protected with our privacy controls designed with Islamic values in mind.
              </p>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="container px-4 py-16 md:py-24 bg-gray-50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Quluub Works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Finding your compatible match has never been easier
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-medium mb-2">Create Profile</h3>
              <p className="text-muted-foreground">Build your profile with your values, preferences and what matters to you</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-medium mb-2">Discover Matches</h3>
              <p className="text-muted-foreground">Browse compatible profiles selected based on your requirements</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-medium mb-2">Connect</h3>
              <p className="text-muted-foreground">Start meaningful conversations in a respectful environment</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">4</div>
              <h3 className="text-xl font-medium mb-2">Meet</h3>
              <p className="text-muted-foreground">Take your connection to the next level with family involvement</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join thousands of Muslims who found their life partner through Quluub
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=100&h=100" 
                  alt="Testimonial" 
                  className="w-16 h-16 rounded-full object-cover mb-3"
                />
                <h4 className="font-medium">Fatima & Ahmed</h4>
                <p className="text-sm text-muted-foreground">Married 1 year</p>
              </div>
              <p className="text-muted-foreground text-center italic">
                "Alhamdulillah, we found each other on Quluub and connected over our shared values and goals. The compatibility matching was truly helpful."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&h=100" 
                  alt="Testimonial" 
                  className="w-16 h-16 rounded-full object-cover mb-3"
                />
                <h4 className="font-medium">Aisha & Omar</h4>
                <p className="text-sm text-muted-foreground">Engaged</p>
              </div>
              <p className="text-muted-foreground text-center italic">
                "The guided communication on Quluub helped us discuss important topics early. We felt secure and respected throughout our journey."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=100&h=100" 
                  alt="Testimonial" 
                  className="w-16 h-16 rounded-full object-cover mb-3"
                />
                <h4 className="font-medium">Noor & Ibrahim</h4>
                <p className="text-sm text-muted-foreground">Married 6 months</p>
              </div>
              <p className="text-muted-foreground text-center italic">
                "What sets Quluub apart is how they honor our Islamic values while using technology to help us find compatibility."
              </p>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-primary text-primary-foreground py-16 md:py-24">
          <div className="container px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to find your blessed match?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of Muslims who have found their life partners through Quluub
            </p>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="secondary" 
                className="rounded-full px-8"
              >
                Create Your Profile
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-xl font-bold text-primary">Quluub</span>
              <p className="text-sm text-muted-foreground mt-2">
                Find your compatible match with faith at heart.
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <h4 className="font-medium mb-3">About</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Our Mission</a></li>
                  <li><a href="#" className="hover:text-primary">How It Works</a></li>
                  <li><a href="#" className="hover:text-primary">Success Stories</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Help Center</a></li>
                  <li><a href="#" className="hover:text-primary">Safety Tips</a></li>
                  <li><a href="#" className="hover:text-primary">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Privacy</a></li>
                  <li><a href="#" className="hover:text-primary">Terms</a></li>
                  <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-12 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Quluub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
