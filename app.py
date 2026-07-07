import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy import create_engine, text
from datetime import datetime
import streamlit_authenticator as stauth
import yaml
from yaml.loader import SafeLoader
import functools
import inspect

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="Quantira Content OS",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium styling
st.markdown("""
    <style>
        .main {
            background-color: #0f111a;
            color: #ffffff;
        }
        .stMetric {
            background-color: #1a1c24;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #2e303d;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        div[data-testid="stMetricValue"] {
            font-size: 2rem;
            font-weight: 700;
            color: #00ffcc;
        }
        div[data-testid="stMetricLabel"] {
            font-size: 0.9rem;
            color: #a0aec0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stButton>button {
            background-color: #00ffcc;
            color: #0f111a;
            font-weight: bold;
            border-radius: 8px;
            border: none;
            transition: all 0.3s ease;
        }
        .stButton>button:hover {
            background-color: #00cca3;
            box-shadow: 0 0 10px #00ffcc;
            color: #0f111a;
        }
        .stTabs [data-baseweb="tab-list"] {
            gap: 24px;
        }
        .stTabs [data-baseweb="tab"] {
            height: 50px;
            white-space: pre-wrap;
            background-color: #1a1c24;
            border-radius: 4px;
            color: white;
            font-weight: bold;
        }
        .stTabs [aria-selected="true"] {
            background-color: #00ffcc;
            color: #0f111a !important;
        }
    </style>
""", unsafe_allow_html=True)

# --- 1. LOAD AUTH CONFIG ---
with open('auth_config.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)

authenticator = stauth.Authenticate(
    config['credentials'],
    config['cookie']['name'],
    config['cookie']['key'],
    config['cookie']['expiry_days']
)

# --- 2. LOGIN HANDLER ---
authenticator.login()
authentication_status = st.session_state.get("authentication_status")
username = st.session_state.get("username")
name = st.session_state.get("name")

# Database helper functions
def get_engine():
    return create_engine("sqlite:///marketing.db")

def load_data(query, params=None):
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn, params=params or {})
    return df

def execute_query(query, params=None):
    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text(query), params or {})
        conn.commit()

# --- 3. DECORATOR AUDIT LOGGER ---
def audit_log(action, table_name):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 1. Execute actual database modification function
            result = func(*args, **kwargs)
            
            # 2. Extract arguments using signature binding
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            
            user_val = bound.arguments.get('username', 'system')
            rec_val = bound.arguments.get('record_id', 'unknown')
            old_val = bound.arguments.get('old_value', None)
            new_val = bound.arguments.get('new_value', None)
            
            # Write to audit_logs
            try:
                execute_query("""
                    INSERT INTO audit_logs (username, action, table_name, record_id, old_value, new_value)
                    VALUES (:user, :action, :table, :rec, :old, :new)
                """, {
                    "user": user_val,
                    "action": action,
                    "table": table_name,
                    "rec": str(rec_val),
                    "old": str(old_val) if old_val is not None else None,
                    "new": str(new_val) if new_val is not None else None
                })
            except Exception as e:
                print(f"Failed to execute audit log decorator: {e}")
            return result
        return wrapper
    return decorator

# --- 4. API / DATABASE WRITE FUNCTIONS (DECORATED) ---

@audit_log(action="CREATE_CONTENT", table_name="content_master")
def create_content_asset(record_id, client_id, campaign_id, title, topic, pillar, funnel, platform, format, priority, owner, pub_date, pub_time, status, health, caption, tags, canva, drive, username, new_value):
    execute_query("""
        INSERT INTO content_master (
            content_id, campaign_id, client_id, content_title, topic, content_pillar, 
            funnel_stage, platform, content_format, priority, owner, publish_date, 
            publish_time, status, health_status, caption, hashtags, canva_link, drive_link
        ) VALUES (
            :id, :camp, :client, :title, :topic, :pillar, :funnel, :platform, :format, 
            :priority, :owner, :pub_date, :pub_time, :status, :health, :caption, :tags, :canva, :drive
        )
    """, {
        "id": record_id, "camp": campaign_id, "client": client_id, "title": title,
        "topic": topic, "pillar": pillar, "funnel": funnel, "platform": platform, "format": format,
        "priority": priority, "owner": owner, "pub_date": pub_date, "pub_time": pub_time, "status": status,
        "health": health, "caption": caption, "tags": tags, "canva": canva, "drive": drive
    })
    
    # Initialize blank production and performance tracking
    execute_query("""
        INSERT INTO content_production (content_id, copywriter, writer_status, designer, design_status, video_editor, editing_status)
        VALUES (:content_id, :owner, 'Draft', NULL, 'Not Required', NULL, 'Not Required')
    """, {"content_id": record_id, "owner": owner})
    
    execute_query("""
        INSERT INTO performance_tracker (content_id, reach, impressions, likes, comments, shares, saves, link_clicks, leads_generated, revenue_generated, engagement_rate, content_score)
        VALUES (:content_id, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00)
    """, {"content_id": record_id})

@audit_log(action="UPDATE_PRODUCTION", table_name="content_production")
def update_production_pipeline(record_id, copywriter, writer_status, designer, design_status, video_editor, editing_status, revision, username, old_value, new_value):
    execute_query("""
        UPDATE content_production
        SET 
            copywriter = :writer,
            writer_status = :writer_status,
            designer = :designer,
            design_status = :design_status,
            video_editor = :editor,
            editing_status = :editing_status,
            revision_count = :revision,
            last_updated = CURRENT_TIMESTAMP
        WHERE content_id = :content_id
    """, {
        "writer": copywriter, "writer_status": writer_status, "designer": designer,
        "design_status": design_status, "editor": video_editor, "editing_status": editing_status,
        "revision": revision, "content_id": record_id
    })

@audit_log(action="ROUTE_TO_APPROVAL", table_name="approvals")
def route_production_for_approval(record_id, requested_by, notes, username, new_value):
    execute_query("""
        INSERT INTO approvals (content_id, approval_status, requested_by, feedback)
        VALUES (:content_id, 'Pending', :user, :notes)
    """, {"content_id": record_id, "user": requested_by, "notes": notes})

@audit_log(action="UPDATE_PERFORMANCE", table_name="performance_tracker")
def update_post_performance(record_id, reach, impressions, likes, comments, shares, saves, clicks, leads, rev, engagement, score, username, old_value, new_value):
    execute_query("""
        UPDATE performance_tracker
        SET 
            reach = :reach, impressions = :impressions, likes = :likes, comments = :comments,
            shares = :shares, saves = :saves, link_clicks = :clicks, leads_generated = :leads,
            revenue_generated = :rev, engagement_rate = :engagement, content_score = :score
        WHERE content_id = :content_id
    """, {
        "reach": reach, "impressions": impressions, "likes": likes, "comments": comments,
        "shares": shares, "saves": saves, "clicks": clicks, "leads": leads,
        "rev": rev, "engagement": engagement, "score": score, "content_id": record_id
    })

@audit_log(action="APPROVE_CONTENT", table_name="content_master")
def approve_content_asset(record_id, approval_id, username, old_value, new_value):
    execute_query("UPDATE approvals SET approval_status = 'Approved', last_updated = CURRENT_TIMESTAMP WHERE approval_id = :aid", {"aid": approval_id})
    execute_query("UPDATE content_master SET status = 'Published' WHERE content_id = :cid", {"cid": record_id})

@audit_log(action="REJECT_CONTENT", table_name="content_master")
def request_content_revision(record_id, approval_id, username, old_value, new_value):
    execute_query("UPDATE approvals SET approval_status = 'Revision Requested', last_updated = CURRENT_TIMESTAMP WHERE approval_id = :aid", {"aid": approval_id})
    execute_query("UPDATE content_master SET status = 'Draft' WHERE content_id = :cid", {"cid": record_id})

@audit_log(action="CREATE_CONTENT_REQUEST", table_name="content_requests")
def submit_content_request(client_id, request_title, description, requested_by, username, new_value):
    execute_query("""
        INSERT INTO content_requests (client_id, request_title, description, requested_by)
        VALUES (:client_id, :title, :desc, :user)
    """, {
        "client_id": client_id, "title": request_title, "desc": description, "user": requested_by
    })

@audit_log(action="APPROVE_CONTENT_REQUEST", table_name="content_requests")
def approve_content_request(record_id, client_name, request_title, description, requested_by, assigned_camp, username, old_value, new_value):
    # Update request status
    execute_query("UPDATE content_requests SET status = 'Approved' WHERE request_id = :rid", {"rid": record_id})
    
    # Initialize asset in content_master pipeline
    c_id = f"CNT{load_data('SELECT COUNT(*) FROM content_master').iloc[0, 0] + 1:03d}"
    client_id = load_data("SELECT client_id FROM clients WHERE client_name = :cname", {"cname": client_name}).iloc[0, 0]
    
    execute_query("""
        INSERT INTO content_master (
            content_id, campaign_id, client_id, content_title, topic, content_pillar,
            funnel_stage, platform, content_format, priority, owner, publish_date,
            publish_time, status, health_status, caption, hashtags
        ) VALUES (
            :cid, :camp, :client, :title, 'Requested Asset', 'Promotional',
            'TOFU', 'LinkedIn', 'Post', 'Medium', :user, DATE('now', '+7 days'),
            '09:00:00', 'Draft', 'Healthy', :desc, ''
        )
    """, {
        "cid": c_id, "camp": assigned_camp, "client": client_id,
        "title": request_title, "user": requested_by, "desc": description
    })
    
    # Initialize production & performance
    execute_query("""
        INSERT INTO content_production (content_id, copywriter, writer_status, designer, design_status, video_editor, editing_status)
        VALUES (:content_id, NULL, 'Draft', NULL, 'Not Required', NULL, 'Not Required')
    """, {"content_id": c_id})
    
    execute_query("""
        INSERT INTO performance_tracker (content_id, reach, impressions, likes, comments, shares, saves, link_clicks, leads_generated, revenue_generated, engagement_rate, content_score)
        VALUES (:content_id, 0, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00)
    """, {"content_id": c_id})

@audit_log(action="REJECT_CONTENT_REQUEST", table_name="content_requests")
def reject_content_request(record_id, username, old_value, new_value):
    execute_query("UPDATE content_requests SET status = 'Rejected' WHERE request_id = :rid", {"rid": record_id})


# --- 5. RENDER FLOW AND NAVIGATION ---
if authentication_status:
    USER_ROLES = {
        'admin': 'Admin',
        'kartar': 'Account Manager',
        'rahul': 'Copywriter',
        'sneha': 'Designer',
        'vikram': 'Reviewer'
    }
    user_role = USER_ROLES.get(username, 'Viewer')
    
    st.sidebar.success(f"Welcome, {name} ({user_role})")
    authenticator.logout('Logout', 'sidebar')
    
    st.sidebar.title("🚀 Quantira Content OS")
    st.sidebar.markdown("---")
    
    # NAVIGATION SETUP
    allowed_pages = ["📊 Executive Dashboard", "📝 Content Master", "🏭 Production & Approvals", "📅 Content Calendar", "📈 Performance Tracker"]
    
    if user_role in ['Admin', 'Account Manager']:
        allowed_pages.extend(["💰 Financials & Retainers", "📥 Content Requests"])
    if user_role in ['Admin', 'Reviewer']:
        allowed_pages.append("✅ Approval Queue")
    if user_role == 'Admin':
        allowed_pages.append("📋 Audit Logs")

    page = st.sidebar.radio("Navigation", allowed_pages)
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### SQLite Connection")
    st.sidebar.info("Connected to `marketing.db` ✅")

    # --- PAGES ---

    if page == "📊 Executive Dashboard":
        st.title("📊 Executive Dashboard")
        
        total_posts = load_data("SELECT COUNT(*) FROM content_master").iloc[0, 0]
        published_posts = load_data("SELECT COUNT(*) FROM content_master WHERE status = 'Published'").iloc[0, 0]
        upcoming_posts = load_data("SELECT COUNT(*) FROM content_master WHERE status = 'Scheduled' OR publish_date > DATE('now')").iloc[0, 0]
        overdue_posts = load_data("SELECT COUNT(*) FROM content_master WHERE status != 'Published' AND publish_date < DATE('now')").iloc[0, 0]
        
        total_leads = load_data("SELECT COALESCE(SUM(leads_generated), 0) FROM performance_tracker").iloc[0, 0]
        total_revenue = load_data("SELECT COALESCE(SUM(revenue_generated), 0) FROM performance_tracker").iloc[0, 0]
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Posts", total_posts)
        col2.metric("Published", published_posts)
        col3.metric("Upcoming", upcoming_posts)
        col4.metric("Overdue", overdue_posts)
        
        st.markdown("---")
        
        col5, col6 = st.columns(2)
        col5.metric("Total Leads", f"{total_leads:,}")
        
        if user_role in ['Admin', 'Account Manager']:
            col6.metric("Total Revenue", f"₹ {total_revenue:,.2f}")
        else:
            col6.metric("Total Revenue", "₹ [Restricted - Admin/AM Only]")

        st.markdown("---")
        st.subheader("Platform breakdown")
        df_content = load_data("SELECT platform AS Platform FROM content_master")
        if not df_content.empty:
            platform_counts = df_content['Platform'].value_counts().reset_index()
            platform_counts.columns = ['Platform', 'Post Count']
            fig_plat = px.pie(
                platform_counts, 
                values='Post Count', 
                names='Platform', 
                hole=0.4,
                color_discrete_sequence=px.colors.qualitative.Pastel
            )
            fig_plat.update_layout(paper_bgcolor='rgba(0,0,0,0)', font=dict(color='white'))
            st.plotly_chart(fig_plat, use_container_width=True)

    elif page == "📝 Content Master":
        st.title("📝 Content Master Repository")
        
        df_content = load_data("""
            SELECT 
                content_id AS "Content ID",
                content_title AS "Content Title",
                topic AS "Topic",
                content_pillar AS "Content Pillar",
                funnel_stage AS "Funnel Stage",
                platform AS "Platform",
                content_format AS "Content Format",
                priority AS "Priority",
                owner AS "Owner",
                publish_date AS "Publish Date",
                status AS "Status",
                health_status AS "Health Status",
                canva_link AS "Canva Link",
                drive_link AS "Drive Link"
            FROM content_master
        """)
        
        view_tab, create_tab = st.tabs(["🔍 View Content Master", "➕ Create Content Asset"])
        
        with view_tab:
            col1, col2 = st.columns(2)
            with col1:
                platform_filter = st.multiselect("Filter by Platform", df_content['Platform'].unique(), default=list(df_content['Platform'].unique()))
            with col2:
                status_filter = st.multiselect("Filter by Status", df_content['Status'].unique(), default=list(df_content['Status'].unique()))
                
            filtered_df = df_content[
                (df_content['Platform'].isin(platform_filter)) & 
                (df_content['Status'].isin(status_filter))
            ]
            
            st.dataframe(filtered_df, use_container_width=True, hide_index=True)
            
        with create_tab:
            if user_role == 'Viewer':
                st.warning("You do not have permissions to launch new content assets.")
            else:
                st.subheader("Add Content Asset to Database")
                
                clients_df = load_data("SELECT client_id, client_name FROM clients")
                campaigns_df = load_data("SELECT campaign_id, campaign_name FROM campaigns")
                
                client_options = {row['client_name']: row['client_id'] for _, row in clients_df.iterrows()}
                campaign_options = {row['campaign_name']: row['campaign_id'] for _, row in campaigns_df.iterrows()}
                
                with st.form("create_asset_form"):
                    col_x, col_y = st.columns(2)
                    c_title = col_x.text_input("Content Title")
                    c_client = col_x.selectbox("Select Client", list(client_options.keys()))
                    c_campaign = col_x.selectbox("Select Campaign", list(campaign_options.keys()))
                    
                    c_topic = col_y.text_input("Topic")
                    c_pillar = col_y.selectbox("Content Pillar", ["Educational", "Inspirational", "Product Features", "Promotional", "Behind the Scenes"])
                    c_funnel = col_y.selectbox("Funnel Stage", ["TOFU", "MOFU", "BOFU"])
                    
                    col_p1, col_p2, col_p3 = st.columns(3)
                    c_platform = col_p1.selectbox("Platform", ["LinkedIn", "YouTube", "Instagram", "Facebook", "Twitter", "Blog"])
                    c_format = col_p2.selectbox("Content Format", ["Infographic", "Video", "Carousel", "Post", "Article", "Shorts"])
                    c_priority = col_p3.selectbox("Priority", ["High", "Medium", "Low"])
                    
                    col_d1, col_d2, col_d3 = st.columns(3)
                    c_owner = col_d1.text_input("Owner", value=name)
                    c_pub_date = col_d2.date_input("Publish Date", datetime.today().date())
                    c_pub_time = col_d3.text_input("Publish Time", "09:00:00")
                    
                    c_status = col_x.selectbox("Publish Status", ["Draft", "Scheduled", "Published"])
                    c_health = col_y.selectbox("Health Status", ["Healthy", "Needs Optimization", "Underperforming"])
                    
                    c_caption = st.text_area("Caption")
                    c_tags = st.text_input("Hashtags")
                    
                    c_canva = col_x.text_input("Canva Link")
                    c_drive = col_y.text_input("Drive Link")
                    
                    submit_asset = st.form_submit_button("Submit Asset")
                    
                    if submit_asset:
                        if not c_title:
                            st.error("Content Title is required.")
                        else:
                            next_id = f"CNT{len(df_content) + 1:03d}"
                            
                            # Invoke decorated DB function
                            create_content_asset(
                                record_id=next_id, client_id=client_options[c_client], campaign_id=campaign_options[c_campaign],
                                title=c_title, topic=c_topic, pillar=c_pillar, funnel=c_funnel, platform=c_platform,
                                format=c_format, priority=c_priority, owner=c_owner, pub_date=c_pub_date.strftime("%Y-%m-%d"),
                                pub_time=c_pub_time, status=c_status, health=c_health, caption=c_caption, tags=c_tags,
                                canva=c_canva, drive=c_drive, username=username,
                                new_value=f"Title: {c_title}, Platform: {c_platform}, Status: {c_status}"
                            )
                            st.success(f"Content asset '{c_title}' successfully created as ID {next_id}!")
                            st.rerun()

    elif page == "🏭 Production & Approvals":
        st.title("🏭 Production & Approvals Pipeline")
        
        df_prod = load_data("""
            SELECT 
                cp.production_id AS "Production ID",
                cp.content_id AS "Content ID",
                cm.content_title AS "Content Title",
                cp.copywriter AS "Copywriter",
                cp.writer_status AS "Writer Status",
                cp.designer AS "Designer",
                cp.design_status AS "Design Status",
                cp.video_editor AS "Video Editor",
                cp.editing_status AS "Editing Status",
                cp.revision_count AS "Revision Count",
                cp.last_updated AS "Last Updated"
            FROM content_production cp
            JOIN content_master cm ON cp.content_id = cm.content_id
        """)
        
        view_tab, update_tab = st.tabs(["🔍 View Production Pipeline", "✍️ Update Pipeline Status"])
        
        with view_tab:
            st.dataframe(df_prod, use_container_width=True, hide_index=True)
            
            st.subheader("Bottleneck Analysis")
            status_counts = df_prod[['Writer Status', 'Design Status', 'Editing Status']].melt()
            fig = px.histogram(status_counts, x='value', color='variable', barmode='group', title="Tasks by Current Status")
            fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(color='white'))
            st.plotly_chart(fig, use_container_width=True)
            
        with update_tab:
            if user_role in ['Viewer']:
                st.warning("Viewers are not authorized to update active production pipelines.")
            else:
                st.subheader("Modify Production Milestone Details")
                prod_options = {f"{row['Content ID']} - {row['Content Title']}": row['Content ID'] for _, row in df_prod.iterrows()}
                
                if prod_options:
                    selected_project = st.selectbox("Select Project to Update", list(prod_options.keys()))
                    sel_content_id = prod_options[selected_project]
                    current_row = df_prod[df_prod['Content ID'] == sel_content_id].iloc[0]
                    
                    with st.form("update_prod_form"):
                        col_u1, col_u2 = st.columns(2)
                        
                        up_writer = col_u1.text_input("Copywriter", value=str(current_row['Copywriter'] or ""))
                        up_writer_status = col_u1.selectbox("Writer Status", ["Draft", "In Review", "Approved", "Requires Edits"], index=["Draft", "In Review", "Approved", "Requires Edits"].index(current_row['Writer Status'] if current_row['Writer Status'] in ["Draft", "In Review", "Approved", "Requires Edits"] else "Draft"))
                        
                        up_designer = col_u2.text_input("Designer", value=str(current_row['Designer'] or ""))
                        up_design_status = col_u2.selectbox("Design Status", ["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"], index=["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"].index(current_row['Design Status'] if current_row['Design Status'] in ["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"] else "Not Required"))
                        
                        up_editor = col_u1.text_input("Video Editor", value=str(current_row['Video Editor'] or ""))
                        up_editing_status = col_u1.selectbox("Editing Status", ["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"], index=["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"].index(current_row['Editing Status'] if current_row['Editing Status'] in ["Not Required", "Drafting", "In Review", "Approved", "Requires Edits"] else "Not Required"))
                        
                        up_revisions = col_u2.number_input("Revision Count", min_value=0, value=int(current_row['Revision Count'] or 0))
                        
                        route_for_approval = st.checkbox("Route project to Vikram (Reviewer) for final approval", value=False)
                        approval_notes = st.text_area("Optional approval notes / review guidelines")
                        
                        submit_update = st.form_submit_button("Update Production File")
                        
                        if submit_update:
                            old_values_str = f"Writer: {current_row['Copywriter']} ({current_row['Writer Status']}), Designer: {current_row['Designer']} ({current_row['Design Status']}), Editor: {current_row['Video Editor']} ({current_row['Editing Status']}), Revisions: {current_row['Revision Count']}"
                            new_values_str = f"Writer: {up_writer} ({up_writer_status}), Designer: {up_designer} ({up_design_status}), Editor: {up_editor} ({up_editing_status}), Revisions: {up_revisions}"
                            
                            # Invoke decorated DB function
                            update_production_pipeline(
                                record_id=sel_content_id, copywriter=up_writer, writer_status=up_writer_status,
                                designer=up_designer, design_status=up_design_status, video_editor=up_editor,
                                editing_status=up_editing_status, revision=up_revisions, username=username,
                                old_value=old_values_str, new_value=new_values_str
                            )
                            
                            if route_for_approval:
                                route_production_for_approval(
                                    record_id=sel_content_id, requested_by=username, notes=approval_notes or "Ready for Review.",
                                    username=username, new_value=f"Requested by: {username}, Notes: {approval_notes}"
                                )
                                st.info("Project routed to approvals queue!")
                                
                            st.success("Production details updated!")
                            st.rerun()
                else:
                    st.warning("No production items found.")

    elif page == "📅 Content Calendar":
        st.title("📅 Content Calendar")
        
        df_cal = load_data("""
            SELECT 
                content_id AS "Content ID",
                content_title AS "Content Title",
                topic AS "Topic",
                content_pillar AS "Content Pillar",
                funnel_stage AS "Funnel Stage",
                platform AS "Platform",
                content_format AS "Content Format",
                priority AS "Priority",
                owner AS "Owner",
                publish_date AS "Publish Date",
                status AS "Status",
                canva_link AS "Canva Link",
                drive_link AS "Drive Link"
            FROM content_master
            WHERE publish_date IS NOT NULL
            ORDER BY publish_date ASC
        """)
        
        if not df_cal.empty:
            df_cal['Publish Date'] = pd.to_datetime(df_cal['Publish Date'])
            calendar_view = df_cal.groupby('Publish Date')
            
            for pub_date, group in calendar_view:
                date_str = pub_date.strftime('%B %d, %Y')
                with st.expander(f"📅 {date_str} ({len(group)} Posts Scheduled)"):
                    for _, row in group.iterrows():
                        priority_color = "#ff4d4d" if row['Priority'] == "High" else ("#ffaa00" if row['Priority'] == "Medium" else "#00b33c")
                        st.markdown(f"""
                            **{row['Content Title']}**
                            - **Platform**: `{row['Platform']}` | **Format**: `{row['Content Format']}`
                            - **Topic**: `{row['Topic']}` | **Priority**: <span style="color: {priority_color}; font-weight: bold;">{row['Priority']}</span>
                            - **Links**: [Canva]({row['Canva Link']}) | [Drive]({row['Drive Link']})
                            <hr style="margin: 8px 0; border: 0; border-top: 1px solid #2e303d;">
                        """, unsafe_allow_html=True)
        else:
            st.info("No content schedules mapped in database.")

    elif page == "📈 Performance Tracker":
        st.title("📈 Performance & ROI Tracker")
        
        df_perf = load_data("""
            SELECT 
                pt.performance_id AS "Performance ID",
                pt.content_id AS "Content ID",
                cm.content_title AS "Content Title",
                cm.platform AS "Platform",
                pt.reach AS "Reach",
                pt.impressions AS "Impressions",
                pt.likes AS "Likes",
                pt.comments AS "Comments",
                pt.shares AS "Shares",
                pt.saves AS "Saves",
                pt.link_clicks AS "Link Clicks",
                pt.leads_generated AS "Leads Generated",
                pt.revenue_generated AS "Revenue Generated",
                pt.engagement_rate AS "Engagement Rate",
                pt.content_score AS "Content Score"
            FROM performance_tracker pt
            JOIN content_master cm ON pt.content_id = cm.content_id
        """)
        
        view_tab, log_tab = st.tabs(["🔍 View Performance Tracker", "✍️ Log Analytics"])
        
        with view_tab:
            if user_role not in ['Admin', 'Account Manager']:
                display_perf_df = df_perf.drop(columns=["Revenue Generated"])
                st.info("Note: Revenue fields are hidden based on your viewer authorization level.")
            else:
                display_perf_df = df_perf.copy()
                
            st.dataframe(display_perf_df, use_container_width=True, hide_index=True)
            
            if not df_perf.empty:
                st.subheader("Engagement vs Reach Matrix")
                fig = px.scatter(
                    df_perf, x='Reach', y='Engagement Rate', size='Content Score', 
                    color='Platform', hover_name='Content Title',
                    title="Content Performance Matrix (Bubble size represents Content Score)"
                )
                fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(color='white'))
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("No performance statistics logged in database.")
                
        with log_tab:
            if user_role not in ['Admin', 'Account Manager', 'Reviewer']:
                st.warning("Your role does not have authorization to log performance analytics.")
            else:
                st.subheader("Log Post Metrics")
                perf_options = {f"{row['Content ID']} - {row['Content Title']}": row['Content ID'] for _, row in df_perf.iterrows()}
                
                if perf_options:
                    selected_perf_post = st.selectbox("Select Post to Log Analytics", list(perf_options.keys()))
                    sel_perf_id = perf_options[selected_perf_post]
                    current_perf = df_perf[df_perf['Content ID'] == sel_perf_id].iloc[0]
                    
                    with st.form("record_perf_form"):
                        col_p1, col_p2, col_p3 = st.columns(3)
                        up_reach = col_p1.number_input("Reach", min_value=0, value=int(current_perf['Reach'] or 0))
                        up_impressions = col_p2.number_input("Impressions", min_value=0, value=int(current_perf['Impressions'] or 0))
                        up_likes = col_p3.number_input("Likes", min_value=0, value=int(current_perf['Likes'] or 0))
                        
                        up_comments = col_p1.number_input("Comments", min_value=0, value=int(current_perf['Comments'] or 0))
                        up_shares = col_p2.number_input("Shares", min_value=0, value=int(current_perf['Shares'] or 0))
                        up_saves = col_p3.number_input("Saves", min_value=0, value=int(current_perf['Saves'] or 0))
                        
                        up_clicks = col_p1.number_input("Link Clicks", min_value=0, value=int(current_perf['Link Clicks'] or 0))
                        up_leads = col_p2.number_input("Leads Generated", min_value=0, value=int(current_perf['Leads Generated'] or 0))
                        
                        if user_role in ['Admin', 'Account Manager']:
                            up_rev = col_p3.number_input("Revenue Generated (₹)", min_value=0.0, value=float(current_perf['Revenue Generated'] or 0.0), format="%.2f")
                        else:
                            st.info("Revenue inputs are locked for non-financial managers.")
                            up_rev = float(current_perf['Revenue Generated'] or 0.0)
                            
                        col_s1, col_s2 = st.columns(2)
                        up_engagement = col_s1.number_input("Engagement Rate (%)", min_value=0.00, max_value=100.00, value=float(current_perf['Engagement Rate'] or 0.0), format="%.2f")
                        up_score = col_s2.number_input("Content Score (1-10)", min_value=0.00, max_value=10.00, value=float(current_perf['Content Score'] or 0.0), format="%.2f")
                        
                        submit_perf = st.form_submit_button("Record Performance Metrics")
                        
                        if submit_perf:
                            old_perf_str = f"Reach: {current_perf['Reach']}, Clicks: {current_perf['Link Clicks']}, Leads: {current_perf['Leads Generated']}, Rev: {current_perf['Revenue Generated']}, Score: {current_perf['Content Score']}"
                            new_perf_str = f"Reach: {up_reach}, Clicks: {up_clicks}, Leads: {up_leads}, Rev: {up_rev}, Score: {up_score}"
                            
                            # Invoke decorated DB function
                            update_post_performance(
                                record_id=sel_perf_id, reach=up_reach, impressions=up_impressions, likes=up_likes,
                                comments=up_comments, shares=up_shares, saves=up_saves, clicks=up_clicks,
                                leads=up_leads, rev=up_rev, engagement=up_engagement, score=up_score,
                                username=username, old_value=old_perf_str, new_value=new_perf_str
                            )
                            st.success("Performance logs recorded!")
                            st.rerun()
                else:
                    st.warning("No performance items found.")

    elif page == "💰 Financials & Retainers":
        st.title("💰 Financials & Retainers Dashboard")
        st.write("Overview of client accounts, monthly retainer details, and campaigns budgets.")
        
        clients_df = load_data("SELECT client_name AS 'Client Name', industry AS 'Industry', monthly_retainer AS 'Monthly Retainer', status AS 'Status' FROM clients")
        st.subheader("Client Retainer Information")
        st.dataframe(clients_df, use_container_width=True, hide_index=True)
        
        campaigns_df = load_data("SELECT campaign_name AS 'Campaign Name', budget AS 'Allocated Budget', expected_revenue AS 'Expected Revenue', status AS 'Campaign Status' FROM campaigns")
        st.subheader("Campaign Allocations")
        st.dataframe(campaigns_df, use_container_width=True, hide_index=True)

    elif page == "✅ Approval Queue":
        st.title("✅ Approval Queue")
        
        appr_df = load_data("SELECT approval_id AS approval_id, content_id AS content_id, requested_by AS requested_by, feedback AS feedback FROM approvals WHERE approval_status = 'Pending'")
        
        if not appr_df.empty:
            for index, row in appr_df.iterrows():
                with st.expander(f"Review Content Asset: {row['content_id']} (Requested by: {row['requested_by']})"):
                    st.markdown(f"**Description/Guidelines**: {row['feedback']}")
                    
                    content_meta = load_data("SELECT content_title, platform, owner, caption FROM content_master WHERE content_id = :cid", {"cid": row['content_id']})
                    if not content_meta.empty:
                        st.markdown(f"""
                            - **Title**: `{content_meta.iloc[0]['content_title']}`
                            - **Platform**: `{content_meta.iloc[0]['platform']}`
                            - **Owner**: `{content_meta.iloc[0]['owner']}`
                            - **Caption Copy**:
                            > {content_meta.iloc[0]['caption']}
                        """)
                    
                    col_b1, col_b2 = st.columns(2)
                    
                    if col_b1.button("Approve & Publish", key=f"app_{row['approval_id']}"):
                        # Invoke decorated DB function
                        approve_content_asset(
                            record_id=row['content_id'], approval_id=row['approval_id'],
                            username=username, old_value="Draft/Pending Approval", new_value="Published"
                        )
                        st.success(f"Content {row['content_id']} has been successfully published!")
                        st.rerun()
                            
                    if col_b2.button("Request Revision", key=f"rev_{row['approval_id']}"):
                        # Invoke decorated DB function
                        request_content_revision(
                            record_id=row['content_id'], approval_id=row['approval_id'],
                            username=username, old_value="Draft/Pending Approval", new_value="Draft (Revision Requested)"
                        )
                        st.warning(f"Sent back {row['content_id']} for revision.")
                        st.rerun()
        else:
            st.success("All caught up! No approvals pending in queue.")

    elif page == "📥 Content Requests":
        st.title("📥 Content Requests Pipeline")
        
        view_tab, new_req_tab = st.tabs(["🔍 View Requests Pipeline", "✍️ Make a Request"])
        
        with view_tab:
            requests_df = load_data("""
                SELECT 
                    r.request_id AS "Request ID",
                    cl.client_name AS "Client Name",
                    r.request_title AS "Request Title",
                    r.description AS "Description",
                    r.requested_by AS "Requested By",
                    r.request_date AS "Request Date",
                    r.status AS "Status"
                FROM content_requests r
                JOIN clients cl ON r.client_id = cl.client_id
            """)
            st.dataframe(requests_df, use_container_width=True, hide_index=True)
            
            if not requests_df.empty:
                st.markdown("### Approve Request & Add to Pipeline")
                pending_requests = requests_df[requests_df['Status'] == 'Pending']
                
                if not pending_requests.empty:
                    req_options = {f"{row['Request ID']} - {row['Request Title']} ({row['Client Name']})": row['Request ID'] for _, row in pending_requests.iterrows()}
                    selected_req = st.selectbox("Select Pending Request to Process", list(req_options.keys()))
                    sel_req_id = req_options[selected_req]
                    req_row = pending_requests[pending_requests['Request ID'] == sel_req_id].iloc[0]
                    
                    campaigns_list = load_data("SELECT campaign_id, campaign_name FROM campaigns")
                    camp_options = {row['campaign_name']: row['campaign_id'] for _, row in campaigns_list.iterrows()}
                    selected_camp = st.selectbox("Assign to Campaign Pipeline", list(camp_options.keys()))
                    
                    col_act1, col_act2 = st.columns(2)
                    
                    if col_act1.button("Approve & Initialize Pipeline"):
                        # Invoke decorated DB function
                        approve_content_request(
                            record_id=sel_req_id, client_name=req_row['Client Name'], request_title=req_row['Request Title'],
                            description=req_row['Description'], requested_by=req_row['Requested By'], assigned_camp=camp_options[selected_camp],
                            username=username, old_value="Pending", new_value="Approved"
                        )
                        st.success(f"Request approved! New asset initialized in pipeline.")
                        st.rerun()
                            
                    if col_act2.button("Reject Request"):
                        # Invoke decorated DB function
                        reject_content_request(
                            record_id=sel_req_id, username=username, old_value="Pending", new_value="Rejected"
                        )
                        st.warning(f"Request {sel_req_id} rejected.")
                        st.rerun()
                else:
                    st.info("No pending requests to approve.")
                    
        with new_req_tab:
            st.subheader("Submit Content Request")
            clients_df = load_data("SELECT client_id, client_name FROM clients")
            client_options = {row['client_name']: row['client_id'] for _, row in clients_df.iterrows()}
            
            with st.form("new_request_form"):
                req_title = st.text_input("Request Title (e.g. Q4 Sale Poster)")
                req_client = st.selectbox("Requesting Client", list(client_options.keys()))
                req_desc = st.text_area("Detailed Asset Description / Requirements")
                
                submit_req = st.form_submit_button("Submit Request")
                
                if submit_req:
                    if not req_title:
                        st.error("Request Title is required.")
                    else:
                        # Invoke decorated DB function
                        submit_content_request(
                            client_id=client_options[req_client], request_title=req_title, description=req_desc,
                            requested_by=name, username=username, new_value=f"Title: {req_title}, Client: {req_client}"
                        )
                        st.success(f"Request '{req_title}' submitted successfully!")
                        st.rerun()

    elif page == "📋 Audit Logs":
        st.title("📋 Database Audit Logs")
        st.write("Chronological record of user actions and database state mutations (Restricted - Admin Only).")
        
        audit_df = load_data("""
            SELECT 
                log_id AS "Log ID", 
                timestamp AS "Timestamp", 
                username AS "User", 
                action AS "Action", 
                table_name AS "Table", 
                record_id AS "Record ID", 
                old_value AS "Old Value", 
                new_value AS "New Value" 
            FROM audit_logs 
            ORDER BY timestamp DESC
        """)
        st.dataframe(audit_df, use_container_width=True, hide_index=True)

elif authentication_status is False:
    st.error('Username/password is incorrect')
elif authentication_status is None:
    st.warning('Please enter your username and password')
