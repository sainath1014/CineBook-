import json
import uuid
import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from core.models import (
    UserProfile, City, Theatre, Screen, Seat,
    Movie, Show, Booking, BookingSeat, Payment, Ticket
)
from core.utils import generate_secure_token, generate_qr_code_base64


class Command(BaseCommand):
    help = 'Seeds database with Hyderabad demo theatres, screens, seat layouts, sample movies, shows, and demo users.'

    def handle(self, *args, **options):
        self.stdout.write("Starting CineBook database seeding...")

        # 1. Create or get City: Hyderabad
        hyd, _ = City.objects.get_or_create(
            name="Hyderabad",
            defaults={"state": "Telangana", "is_active": True}
        )
        blr, _ = City.objects.get_or_create(
            name="Bengaluru",
            defaults={"state": "Karnataka", "is_active": True}
        )
        self.stdout.write(self.style.SUCCESS(f"[OK] Cities ensured: {hyd.name}, {blr.name}"))

        # 2. Create Hyderabad and Bengaluru Demo Theatres
        theatres_data = [
            # Hyderabad Demo Theatres
            {
                "name": "CineBook Demo Theatre — Ameerpet",
                "city": hyd,
                "address": "4th Floor, Metro Mall, Ameerpet, Hyderabad",
                "landmark": "Near Ameerpet Metro Interchange",
            },
            {
                "name": "CineBook Demo Theatre — Kukatpally",
                "city": hyd,
                "address": "Sujana Cinema Plaza, KPHB Phase 1, Kukatpally, Hyderabad",
                "landmark": "Opposite Forum Sujana Mall",
            },
            {
                "name": "CineBook Demo Theatre — Gachibowli",
                "city": hyd,
                "address": "Tech Zone Complex, Financial District, Gachibowli, Hyderabad",
                "landmark": "Near WaveRock SEZ",
            },
            # Bengaluru Demo Theatres
            {
                "name": "CineBook Demo Theatre — Koramangala",
                "city": blr,
                "address": "Nexus Mall, 80 Feet Road, Koramangala 4th Block, Bengaluru",
                "landmark": "Opposite Sony World Signal",
            },
            {
                "name": "CineBook Demo Theatre — Indiranagar",
                "city": blr,
                "address": "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru",
                "landmark": "Near Indiranagar Metro Station",
            },
            {
                "name": "CineBook Demo Theatre — Whitefield",
                "city": blr,
                "address": "ITPB Cinema Hub, Whitefield Main Road, Bengaluru",
                "landmark": "Near ITPL Tech Park",
            },
        ]

        theatre_objs = {}
        for td in theatres_data:
            theatre, _ = Theatre.objects.get_or_create(
                name=td["name"],
                city=td["city"],
                defaults={
                    "address": td["address"],
                    "landmark": td["landmark"],
                    "is_demo": True,
                    "is_active": True,
                }
            )
            theatre_objs[td["name"]] = theatre
            self.stdout.write(f"  [OK] Theatre ready: {theatre.name} ({td['city'].name})")

        # 3. Create Screens and Seats for each Theatre
        screen_configs = [
            {"name": "Screen 1 - IMAX 3D", "sound_type": "IMAX 12-Track Immersive Sound"},
            {"name": "Screen 2 - Dolby Atmos", "sound_type": "Dolby Atmos 7.1 Surround"},
            {"name": "Screen 3 - Premiere 4K", "sound_type": "JBL 5.1 Dolby Digital"},
        ]

        # Seat layout inspired by reference image: Rows A-H
        # Row A-B: Recliner (8 seats)
        # Row C-E: Premium (10 seats)
        # Row F-H: Regular (10 seats)
        layout_spec = [
            ("A", 8, "RECLINER"),
            ("B", 8, "RECLINER"),
            ("C", 10, "PREMIUM"),
            ("D", 10, "PREMIUM"),
            ("E", 10, "PREMIUM"),
            ("F", 10, "REGULAR"),
            ("G", 10, "REGULAR"),
            ("H", 10, "REGULAR"),
        ]

        for theatre in theatre_objs.values():
            for sc in screen_configs:
                screen, created = Screen.objects.get_or_create(
                    theatre=theatre,
                    name=sc["name"],
                    defaults={
                        "sound_type": sc["sound_type"],
                        "total_capacity": 76
                    }
                )
                if created or screen.seats.count() == 0:
                    seats_to_create = []
                    for row_letter, seat_count, cat in layout_spec:
                        for num in range(1, seat_count + 1):
                            seats_to_create.append(Seat(
                                screen=screen,
                                row=row_letter,
                                number=num,
                                seat_label=f"{row_letter}{num}",
                                category=cat
                            ))
                    Seat.objects.bulk_create(seats_to_create)

        self.stdout.write(self.style.SUCCESS("[OK] Screens and seat layouts created (Rows A-H, Recliner/Premium/Regular)"))

        # 4. Seed Movie Data (Required 10 movies with verified TMDB URLs)
        movies_data = [
            {
                "title": "Avengers: Infinity War",
                "synopsis": "The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation and ruin puts an end to the universe.",
                "genre": "Action / Sci-Fi / Adventure",
                "language": "English",
                "duration_minutes": 149,
                "release_date": datetime.date(2018, 4, 27),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=6ZfuNTqbHE8",
                "rating": Decimal('8.5'),
                "cast": "Robert Downey Jr., Chris Hemsworth, Mark Ruffalo, Chris Evans, Scarlett Johansson, Benedict Cumberbatch, Josh Brolin",
                "director": "Anthony Russo, Joe Russo",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Interstellar",
                "synopsis": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
                "genre": "Sci-Fi / Drama / Adventure",
                "language": "English",
                "duration_minutes": 169,
                "release_date": datetime.date(2014, 11, 7),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=zSWdZVtXT7E",
                "rating": Decimal('8.7'),
                "cast": "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine, Matt Damon",
                "director": "Christopher Nolan",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Inception",
                "synopsis": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
                "genre": "Action / Sci-Fi / Thriller",
                "language": "English",
                "duration_minutes": 148,
                "release_date": datetime.date(2010, 7, 16),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=YoHD9XEInc0",
                "rating": Decimal('8.8'),
                "cast": "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy, Ken Watanabe, Cillian Murphy",
                "director": "Christopher Nolan",
                "status": "NOW_SHOWING",
            },
            {
                "title": "The Dark Knight",
                "synopsis": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                "genre": "Action / Crime / Drama",
                "language": "English",
                "duration_minutes": 152,
                "release_date": datetime.date(2008, 7, 18),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=EXeTwQWrcwY",
                "rating": Decimal('9.0'),
                "cast": "Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine, Maggie Gyllenhaal, Gary Oldman, Morgan Freeman",
                "director": "Christopher Nolan",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Baahubali: The Beginning",
                "synopsis": "In the kingdom of Mahishmati, a fierce warrior rises from obscurity to uncover his royal heritage and avenge the murder of his father, the legendary Amarendra Baahubali.",
                "genre": "Action / Drama / Historical",
                "language": "Telugu",
                "duration_minutes": 159,
                "release_date": datetime.date(2015, 7, 10),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/9BAjt8nSSms62uOVYn1t3C3dVto.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/e9ZEuHGHZ06AToHlfN1L7nejJ7W.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=sOEg_YZQsTI",
                "rating": Decimal('8.2'),
                "cast": "Prabhas, Rana Daggubati, Anushka Shetty, Tamannaah Bhatia, Ramya Krishna, Sathyaraj",
                "director": "S. S. Rajamouli",
                "status": "NOW_SHOWING",
            },
            {
                "title": "RRR",
                "synopsis": "A fearless revolutionary and an officer in the British force, who once were friends, join forces to chart a new path against oppressive British rulers in 1920s India.",
                "genre": "Action / Drama / Period",
                "language": "Telugu",
                "duration_minutes": 182,
                "release_date": datetime.date(2022, 3, 25),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=NgBoAMa97lQ",
                "rating": Decimal('8.6'),
                "cast": "N. T. Rama Rao Jr., Ram Charan, Ajay Devgn, Alia Bhatt, Shriya Saran, Samuthirakani",
                "director": "S. S. Rajamouli",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Pushpa: The Rise",
                "synopsis": "Pushpa Raj, a coolie, rises through the ranks of a red sandalwood smuggling syndicate in the Seshachalam hills of Andhra Pradesh, locking horns with relentless police officer Bhanwar Singh Shekhawat.",
                "genre": "Action / Crime / Thriller",
                "language": "Telugu",
                "duration_minutes": 179,
                "release_date": datetime.date(2021, 12, 17),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/h6Pd89ngvl9quPVsx3KoJlQsvk9.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/jQIcn51nsvMrpB9NFwEOb9QHhFt.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=Q1NKMPhP8PY",
                "rating": Decimal('8.0'),
                "cast": "Allu Arjun, Fahadh Faasil, Rashmika Mandanna, Jagadeesh Prathap Bandari, Sunil",
                "director": "Sukumar",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Kalki 2898 AD",
                "synopsis": "Set in a post-apocalyptic world in the year 2898 AD, a modern-day avatar of Vishnu descends to protect the world from evil forces in the sacred city of Kasi.",
                "genre": "Sci-Fi / Action / Mythological",
                "language": "Telugu",
                "duration_minutes": 181,
                "release_date": datetime.date(2024, 6, 27),
                "certification": "U/A",
                "poster_url": "https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=kQDd1AhGIHk",
                "rating": Decimal('8.3'),
                "cast": "Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone, Disha Patani",
                "director": "Nag Ashwin",
                "status": "NOW_SHOWING",
            },
            {
                "title": "Hi Nanna",
                "synopsis": "A single father Viraj and his 6-year-old daughter Mahi, who suffers from cystic fibrosis, meet a kind-hearted woman Yashna who becomes an inseparable part of their lives, holding secrets to their past.",
                "genre": "Romance / Drama / Family",
                "language": "Telugu",
                "duration_minutes": 155,
                "release_date": datetime.date(2023, 12, 7),
                "certification": "U",
                "poster_url": "https://image.tmdb.org/t/p/w500/hhMLtq9m1aK0dpY9Wcq26XeDH2z.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/2vxKa3gMHc84O1iHRkslqeHSsxE.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=bC36d8es350",
                "rating": Decimal('8.1'),
                "cast": "Nani, Mrunal Thakur, Baby Kiara Khanna, Jayaram, Priyadarshi Pulikonda",
                "director": "Shouryuv",
                "status": "COMING_SOON",
            },
            {
                "title": "Dangal",
                "synopsis": "Former wrestler Mahavir Singh Phogat trains his young daughters Geeta and Babita to become world-class wrestlers, overcoming immense social stigma to win India's first gold medal at the Commonwealth Games.",
                "genre": "Sports / Biography / Drama",
                "language": "Hindi",
                "duration_minutes": 161,
                "release_date": datetime.date(2016, 12, 23),
                "certification": "U",
                "poster_url": "https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg",
                "backdrop_url": "https://image.tmdb.org/t/p/original/l0fNAHLOFReQJsxCOmGWvJDnimn.jpg",
                "trailer_url": "https://www.youtube.com/watch?v=x_7YlGv9u1g",
                "rating": Decimal('8.4'),
                "cast": "Aamir Khan, Sakshi Tanwar, Fatima Sana Shaikh, Sanya Malhotra, Zaira Wasim, Suhani Bhatnagar",
                "director": "Nitesh Tiwari",
                "status": "COMING_SOON",
            },
        ]

        # Attractive portrait fallback poster if external URLs are unreachable
        fallback_poster = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80"
        fallback_backdrop = "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80"

        movie_objs = {}
        for m in movies_data:
            movie, _ = Movie.objects.update_or_create(
                title=m["title"],
                defaults={
                    "synopsis": m["synopsis"],
                    "genre": m["genre"],
                    "language": m["language"],
                    "duration_minutes": m["duration_minutes"],
                    "release_date": m["release_date"],
                    "certification": m["certification"],
                    "poster_url": m["poster_url"] or fallback_poster,
                    "backdrop_url": m["backdrop_url"] or fallback_backdrop,
                    "trailer_url": m["trailer_url"],
                    "rating": m["rating"],
                    "cast": m["cast"],
                    "director": m["director"],
                    "status": m["status"],
                }
            )
            movie_objs[m["title"]] = movie
            self.stdout.write(f"  [OK] Movie ready: {movie.title} ({movie.language})")

        self.stdout.write(self.style.SUCCESS("[OK] All 10 sample movies seeded successfully."))

        # 5. Create Scheduled Shows for the next 5 days
        today = datetime.date.today()
        show_times = [
            (datetime.time(9, 30), datetime.time(12, 0)),
            (datetime.time(13, 45), datetime.time(16, 15)),
            (datetime.time(17, 0), datetime.time(19, 30)),
            (datetime.time(20, 15), datetime.time(22, 45)),
        ]

        shows_created_count = 0
        screens = list(Screen.objects.all())
        movies_list = list(Movie.objects.filter(status='NOW_SHOWING'))

        for day_offset in range(5):
            show_date = today + datetime.timedelta(days=day_offset)
            for idx, screen in enumerate(screens):
                # Distribute movies among screens
                assigned_movie = movies_list[(idx + day_offset) % len(movies_list)]
                for start_t, end_t in show_times:
                    show, created = Show.objects.get_or_create(
                        movie=assigned_movie,
                        screen=screen,
                        date=show_date,
                        start_time=start_t,
                        defaults={
                            "end_time": end_t,
                            "price_regular": Decimal('150.00'),
                            "price_premium": Decimal('250.00'),
                            "price_recliner": Decimal('350.00'),
                            "is_active": True,
                        }
                    )
                    if created:
                        shows_created_count += 1

        self.stdout.write(self.style.SUCCESS(f"[OK] Created/Ensured scheduled shows (added {shows_created_count} shows)."))

        # 6. Create Seed Users
        # Admin
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@cinebook.demo",
                "first_name": "CineBook",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True
            }
        )
        admin_user.set_password("admin123")
        admin_user.save()
        UserProfile.objects.update_or_create(
            user=admin_user,
            defaults={"role": "ADMIN", "phone": "+91 9999900000"}
        )

        # Staff Accounts for each theatre (Hyderabad & Bengaluru)
        theatre_staff_map = [
            ("staff_ameerpet", "CineBook Demo Theatre — Ameerpet"),
            ("staff_kukatpally", "CineBook Demo Theatre — Kukatpally"),
            ("staff_gachibowli", "CineBook Demo Theatre — Gachibowli"),
            ("staff_koramangala", "CineBook Demo Theatre — Koramangala"),
            ("staff_indiranagar", "CineBook Demo Theatre — Indiranagar"),
            ("staff_whitefield", "CineBook Demo Theatre — Whitefield"),
        ]

        staff_users = {}
        for staff_username, theatre_name in theatre_staff_map:
            theatre = theatre_objs.get(theatre_name)
            staff_user, _ = User.objects.get_or_create(
                username=staff_username,
                defaults={
                    "email": f"{staff_username}@cinebook.demo",
                    "first_name": "Staff",
                    "last_name": theatre_name.split('—')[-1].strip(),
                    "is_staff": True,
                }
            )
            staff_user.set_password("staff123")
            staff_user.save()
            UserProfile.objects.update_or_create(
                user=staff_user,
                defaults={"role": "STAFF", "phone": "+91 9888800000", "theatre": theatre}
            )
            staff_users[staff_username] = staff_user
            self.stdout.write(f"  [OK] Staff created: {staff_username} (Assigned: {theatre_name})")

        # Customer Accounts
        customer, _ = User.objects.get_or_create(
            username="customer1",
            defaults={
                "email": "customer1@cinebook.demo",
                "first_name": "Angel",
                "last_name": "DirYang",
            }
        )
        customer.set_password("cust123")
        customer.save()
        UserProfile.objects.update_or_create(
            user=customer,
            defaults={"role": "CUSTOMER", "phone": "+91 9777700000"}
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seed users created: admin, staff, and customer1."))

        # 7. Create a Sample Confirmed Booking with QR Ticket for Demo Testing
        sample_show = Show.objects.filter(
            movie__title="Avengers: Infinity War",
            screen__theatre__name="CineBook Demo Theatre — Ameerpet"
        ).first()

        if sample_show:
            sample_seats = Seat.objects.filter(
                screen=sample_show.screen,
                row="C",
                number__in=[3, 4, 5]
            )
            if sample_seats.count() == 3:
                # Ensure no duplicate booking
                booking_ref = f"CB-{today.strftime('%Y%m%d')}-DEMO01"
                booking, created = Booking.objects.get_or_create(
                    booking_reference=booking_ref,
                    defaults={
                        "user": customer,
                        "show": sample_show,
                        "total_tickets": 3,
                        "base_amount": Decimal('750.00'),
                        "convenience_fee": Decimal('90.00'),
                        "tax_amount": Decimal('16.20'),
                        "grand_total": Decimal('856.20'),
                        "status": "CONFIRMED"
                    }
                )

                if created:
                    for s in sample_seats:
                        BookingSeat.objects.get_or_create(
                            booking=booking,
                            show=sample_show,
                            seat=s,
                            defaults={"category": s.category, "price": Decimal('250.00')}
                        )

                    Payment.objects.get_or_create(
                        booking=booking,
                        defaults={
                            "payment_method": "SIMULATED_CARD",
                            "transaction_id": f"txn_demo_{uuid.uuid4().hex[:12]}",
                            "gateway_order_id": "order_demo12345",
                            "gateway_payment_id": "pay_demo12345",
                            "amount": Decimal('856.20'),
                            "status": "COMPLETED",
                            "is_simulated": True
                        }
                    )

                    token = "cbt_demo_token_ameerpet_infinity_war"
                    ticket_number = "TKT-DEMO8899"
                    qr_payload = json.dumps({
                        "ticket": ticket_number,
                        "token": token,
                        "ref": booking.booking_reference
                    })
                    qr_image = generate_qr_code_base64(qr_payload)

                    Ticket.objects.get_or_create(
                        booking=booking,
                        defaults={
                            "ticket_number": ticket_number,
                            "verification_token": token,
                            "qr_code_image": qr_image,
                            "status": "VALID"
                        }
                    )
                    self.stdout.write(self.style.SUCCESS(f"[OK] Sample confirmed booking & QR ticket ready (Ref: {booking_ref}, Ticket: {ticket_number})"))

        self.stdout.write(self.style.SUCCESS("[OK] CineBook Database Seeding Completed Successfully!"))
