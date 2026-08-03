const fs = require('fs');

const targetFile = 'src/components/SearchResults.tsx';
const lines = fs.readFileSync(targetFile, 'utf8').split('\n');

const startIndex = 793;
const endIndex = 955; // Up to but not including ))} which is line 957

const newComponent = `                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent group-hover:border-l-kongo-lime overflow-hidden">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Section 1: Itinéraire et détails (Col 1-7) */}
                        <div className="min-w-0 lg:col-span-7">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-xl text-kongo-black">{trip.company}</h3>
                            {trip.vehicleType === 'train' ? <Train className="w-5 h-5 text-gray-400" /> : <Bus className="w-5 h-5 text-gray-400" />}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-6">
                            <Badge className="bg-kongo-lime text-kongo-black font-bold text-xs hover:bg-kongo-lime rounded-sm px-2 py-0.5">{trip.busType}</Badge>
                            {trip.isPopular && <Badge className="bg-orange-100 text-orange-700 font-bold text-xs border-none hover:bg-orange-100 rounded-sm px-2 py-0.5">Populaire</Badge>}
                          </div>

                          <div className="flex items-center space-x-4 mb-4">
                            <div className="text-left">
                              <div className="text-4xl font-extrabold text-kongo-black leading-none mb-1">{trip.departure}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.from}</div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative min-w-[80px]">
                              <div className="flex items-center w-full pt-4 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center bg-white px-2 z-10 text-gray-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span className="text-xs font-bold">{trip.duration}</span>
                                </div>
                                <div className="h-[2px] bg-gray-200 flex-1"></div>
                                <div className="h-[2px] bg-gray-200 flex-1"></div>
                              </div>
                            </div>

                            <div className="text-left">
                              <div className="text-4xl font-extrabold text-kongo-black leading-none mb-1">{trip.arrival}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.to}</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 mb-6 font-medium">
                            {(trip.stops && trip.stops.length > 0) ? (
                              <span>Arrêts: {trip.stops.join(', ')}</span>
                            ) : (
                              <span>Trajet direct</span>
                            )}
                          </div>

                          {/* Detail trajet simulé */}
                          <div className="mb-6 border-l-2 border-blue-100 pl-4 py-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-bold text-blue-900">Trajet multi-étapes</span>
                            </div>
                            <div className="space-y-2 text-xs text-blue-800/80 mb-3">
                              <div className="flex justify-between max-w-sm">
                                <span>{trip.from} → Matadi</span>
                                <span className="font-medium text-gray-500">05:30 - 09:45</span>
                              </div>
                              <div className="flex justify-between max-w-sm">
                                <span>Matadi → Boma</span>
                                <span className="font-medium text-gray-500">10:30 - 13:15</span>
                              </div>
                            </div>
                            <div className="text-xs text-blue-800/60 leading-relaxed max-w-md">
                              <span className="font-semibold text-blue-900/80">Points d'intérêt: </span>
                              Vue panoramique sur le fleuve, pont Maréchal.
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                            {trip.amenitiesLabels?.slice(0, 4).map((f, i) => (
                              <span key={i} className="bg-gray-50 px-2 py-1 rounded-md">{f}</span>
                            ))}
                            {trip.amenitiesLabels && trip.amenitiesLabels.length > 4 && (
                              <span className="font-bold text-gray-400">+{trip.amenitiesLabels.length - 4} autres</span>
                            )}
                          </div>
                        </div>

                        {/* Section 2: Info & Alertes (Col 8-9) */}
                        <div className="lg:col-span-2 flex flex-col pt-2 lg:pl-6 lg:border-l border-gray-100 space-y-4">
                           <div className="flex items-center space-x-1.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg text-kongo-black">{trip.rating}</span>
                            <span className="text-xs text-gray-400">({trip.reviews})</span>
                          </div>

                          <div className={'flex items-center space-x-1.5 font-bold text-xs ' + (trip.availableSeats > 10 ? 'text-green-600' : trip.availableSeats > 0 ? 'text-yellow-600' : 'text-red-600')}>
                             <div className={'w-2 h-2 rounded-full animate-pulse ' + (trip.availableSeats > 10 ? 'bg-green-600' : trip.availableSeats > 0 ? 'bg-yellow-600' : 'bg-red-600')} />
                             <span>{trip.availableSeats} places</span>
                          </div>
                           
                          <Button variant="outline" className="w-full border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:text-green-800 rounded-lg h-9 shadow-sm font-semibold text-xs justify-start px-3">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                             Alerte prix
                          </Button>

                          <div className="w-full border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col relative mt-2">
                             <div className="flex items-start space-x-2">
                               <div className="pt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                               <div>
                                 <p className="text-[11px] font-bold text-kongo-black leading-tight mb-2">Alerte active</p>
                                 <p className="text-[9px] text-gray-500 uppercase leading-snug mb-2">Si prix &lt; {(trip.price * 0.9).toLocaleString()} CDF</p>
                                 <div className="inline-block border border-green-500 text-green-600 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold">ACTIF</div>
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* Section 3: Prix et Action (Col 10-12) */}
                        <div className="lg:col-span-3 flex flex-col justify-between pt-2 lg:pl-6 lg:border-l border-gray-100 min-h-full">
                          <div className="text-right">
                            <div className="text-4xl font-black text-kongo-black tracking-tight mb-1">
                              {trip.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              CDF / personne
                            </div>
                          </div>

                          <div className="mt-8 text-right flex flex-col items-end">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userRole === 'guest' || !userRole) {
                                  toast.error("Connexion requise", {
                                    description: "Vous devez être connecté.",
                                  });
                                  return;
                                }
                                onSelectTrip(trip);
                              }}
                              disabled={trip.availableSeats === 0}
                              className={'w-full h-12 rounded-xl font-black text-base transition-all shadow-sm ' + (trip.availableSeats === 0 ? 'bg-gray-100 text-gray-400' : 'bg-kongo-lime text-kongo-black hover:bg-[#aedf25] hover:scale-[1.02]')}
                            >
                              {trip.availableSeats === 0 ? 'Complet' : 'Sélectionner'}
                            </Button>
                            <div className="mt-2 text-[11px] text-gray-400 font-medium text-center w-full">
                              Pour {currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </motion.div>`;

lines.splice(startIndex, endIndex - startIndex + 1, newComponent);

fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
console.log('Successfully replaced lines');
